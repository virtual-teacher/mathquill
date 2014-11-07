/**
 * without blocks or children.
 *
 * This holds unmerged letters. Numbers? Spaces?
 */
var UnitChar = P(UnitCommand, function(_, super_) {

  _.init = function(ch) {
      this.name = ch;
      this.textTemplate = [ ch ];
      super_.init.call(this);
  };

  _.parser = function() {
      return Parser.succeed(this);
  };

  _.numBlocks = function() {
      return 0;
  };

  _.createBlocks = noop;

  _.react = function() {
      return React.DOM.var({
          "data-mathquill-block-id": this.id,
      }, this.name);
  };

  _.latex = _.text = function() {
    return this.name;
  };

  // _.finalizeTree = _.siblingDeleted = _.siblingCreated = noop;

  _.replaces = function(replacedFragment) {
    replacedFragment.remove();
  };

  _.moveTowards = function(dir, cursor) {
    cursor.jQ.insDirOf(dir, this.jQ);
    cursor[-dir] = this;
    cursor[dir] = this[dir];
  };

  _.deleteTowards = function(dir, cursor) {
    cursor[dir] = this.remove()[dir];
  };

  _.seek = function(pageX, cursor) {
    // insert at whichever side the click was closer to
    if (pageX - this.jQ.offset().left < this.jQ.outerWidth() / 2) {
      cursor.insLeftOf(this);
    } else {
      cursor.insRightOf(this);
    }
  };

  _.placeCursor = noop;

  _.isEmpty = function() {
      return true;
  };
});

var UnitNumber = P(UnitChar, function(_, super_) {
});

var UnitLetter = P(UnitChar, function(_, super_) {
  _.finalizeTree = _.siblingDeleted = _.siblingCreated = function(opts, dir) {
    // don't auto-un-italicize if the sibling to my right changed (dir === R or
    // undefined) and it's now a UnitLetter, it will un-italicize everyone
    if (dir !== L && this[R] instanceof UnitLetter) {
        return;
    }

    this.mergeVariablesToUnits(opts.unitNames);
  };

  _.makeUnit = function(bool) {
      this.jQ.toggleClass('mq-operator-name', bool);
      return this;
  };

  _.mergeVariablesToUnits = function(unitNames) {
    // There are no unit names to merge
    if (unitNames._maxLength === 0) {
        return;
    }

    // want longest possible operator names, so join together entire contiguous
    // sequence of letters
    var str = this.name;
    var l, r;

    // move left...
    for (l = this[L]; l instanceof UnitLetter; l = l[L]) {
        str = l.name + str;
    }
    // ... and right
    for (r = this[R]; r instanceof UnitLetter; r = r[R]) {
        str += r.name;
    }

    var first = l[R] || this.parent.ends[L];
    var last  = r[L] || this.parent.ends[R];

    // removeClass and delete flags from all letters before figuring out
    // which, if any, are part of unit names
    Fragment(first, last).each(function(el) {
        el.makeUnit(false).jQ.removeClass('mq-first mq-last');
        el.name = el.name;
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
