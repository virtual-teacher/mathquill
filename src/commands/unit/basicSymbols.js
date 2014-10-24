/*
 */

var UnitLetter = P(UnitSymbol, function(_, super_) {
  _.init = function(ch) {
      this.letter = ch;
      return super_.init.call(this, ch, '<var>' + ch + '</var>');
  };

  _.react = function() {
      return React.DOM.var({
          "data-mathquill-block-id": this.id,
      }, this.letter);
  };

  // _.html = function() {
  //     return React.renderComponentToStaticMarkup(this.react());
  // };

  _.text = function() {
    return this.name;
  };

  _.latex = _.text;

  _.createLeftOf = function(cursor) {
    var autoCmds = cursor.options.autoCommands, maxLength = autoCmds._maxLength;
    if (maxLength > 0) {
      // want longest possible autocommand, so join together longest
      // sequence of letters
      var str = this.letter, l = cursor[L], i = 1;
      while (l instanceof Letter && i < maxLength) {
        str = l.letter + str, l = l[L], i += 1;
      }
      // check for an autocommand, going thru substrings longest to shortest
      while (str.length) {
        if (autoCmds.hasOwnProperty(str)) {
          for (var i = 2, l = cursor[L]; i < str.length; i += 1, l = l[L]);
          Fragment(l, cursor[L]).remove();
          cursor[L] = l[L];
          return UnitCmds[str](str).createLeftOf(cursor);
        }
        str = str.slice(1);
      }
    }
    super_.createLeftOf.apply(this, arguments);
  };

  _.makeUnit = function(bool) {
    this.jQ.toggleClass('mq-operator-name', bool);
    return this;
  };

  _.finalizeTree = _.siblingDeleted = _.siblingCreated = function(opts, dir) {
    // don't auto-un-italicize if the sibling to my right changed (dir === R or
    // undefined) and it's now a UnitLetter, it will un-italicize everyone
    if (dir !== L && this[R] instanceof UnitLetter) {
        return;
    }

    this.mergeVariablesToUnits(opts.unitNames);
  };

  _.mergeVariablesToUnits = function(unitNames) {
    // There are no unit names to merge
    if (unitNames._maxLength === 0) {
        return;
    }

    // want longest possible operator names, so join together entire contiguous
    // sequence of letters
    var str = this.letter;
    var l, r;

    // move left...
    for (l = this[L]; l instanceof UnitLetter; l = l[L]) {
        str = l.letter + str;
    }
    // ... and right
    for (r = this[R]; r instanceof UnitLetter; r = r[R]) {
        str += r.letter;
    }

    var first = l[R] || this.parent.ends[L];
    var last  = r[L] || this.parent.ends[R];

    // removeClass and delete flags from all letters before figuring out
    // which, if any, are part of unit names
    Fragment(first, last).each(function(el) {
      el.makeUnit(false).jQ.removeClass('mq-first mq-last');
      el.name = el.letter;
    });

    // check for operator names: at each position from left to right, check
    // substrings from longest to shortest
    //
    // say the string to check is "abcd", then we check the following in order:
    // * abcd
    // * abc <-
    // * ab
    // * a
    // * bcd
    // * bc
    // * b
    // * cd
    // * c
    // * d
    //
    // Unless the longest unit name we want to check for is 3, in which case,
    // we start at the arrow.
    var startIx = 0;
    var front = first;
    while (startIx < str.length) {
        var len = min(unitNames._maxLength, str.length - startIx);

        while (true) {
            var endIx = startIx + len;
            var candidateUnit = str.slice(startIx, endIx);

            if (unitNames.hasOwnProperty(candidateUnit)) {
                // we found a match! make it look like a unit and march on.
                var back = walk(front, R, len);
                mergeFragment(front, back);

                front = back;
                startIx = endIx;
                break;
            } else if (len === 1) {
                // kind of an ugly case here - we need to be careful to break
                // on single letters to startIx will be incremented to the next
                // start
                break;
            } else {
                // check the next longest string with the same start
                len--;
            }
        }

        startIx += len;
    }
  };
});

/* Walk n steps in direction dir from cursor and return a new cursor of that
 * location.
 */
function walk(cursor, dir, n) {
    for (var i = 0; i < n; i++) {
        cursor = cursor[dir];
    }
    return cursor;
}

/* Merge all the letters between l and r inclusive into a unit
 *
 * Note this doesn't take a Fragment (though it probably could).
 */
function mergeFragment(l, r) {
    var ptr = l;
    while (ptr !== r) {
        ptr.makeUnit(true);
        ptr = ptr[R];
    }
}

optionProcessors.unitNames = function(cmds) {
  if (!/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
    throw '"'+cmds+'" not a space-delimited list of only letters';
  }
  var list = cmds.split(' '), dict = {}, maxLength = 0;
  for (var i = 0; i < list.length; i += 1) {
    var cmd = list[i];
    dict[cmd] = 1;
    maxLength = max(maxLength, cmd.length);
  }
  dict._maxLength = maxLength;
  return dict;
};

// XXX
// UnitCmds[' '] = UnitCmds.space = bind(VanillaSymbol, '\\ ', ' ');

// XXX seems to work without this - why?
// UnitCmds['¹'] = bind(LatexFragment, '^1');
// UnitCmds['²'] = bind(LatexFragment, '^2');
// UnitCmds['³'] = bind(LatexFragment, '^3');
