/*********************************
 * Symbols for Basic Mathematics
 ********************************/

var UnitLetter = P(UnitSymbol, function(_, super_) {
  _.init = function(ch) {
      this.letter = ch;
      return super_.init.call(this, ch, '<var>' + ch + '</var>');
  };

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

  _.italicize = function(bool) {
    this.jQ.toggleClass('mq-operator-name', !bool);
    return this;
  };

  _.finalizeTree = _.siblingDeleted = _.siblingCreated = function(opts, dir) {
    // don't auto-un-italicize if the sibling to my right changed (dir === R or
    // undefined) and it's now a UnitLetter, it will un-italicize everyone
    if (dir !== L && this[R] instanceof UnitLetter) return;
    this.mergeVariablesToUnits(opts);
  };

  _.mergeVariablesToUnits = function(opts) {
    var autoOps = opts.unitNames;
    if (autoOps._maxLength === 0) return;
    // want longest possible operator names, so join together entire contiguous
    // sequence of letters
    var str = this.letter;
    for (var l = this[L]; l instanceof UnitLetter; l = l[L]) str = l.letter + str;
    for (var r = this[R]; r instanceof UnitLetter; r = r[R]) str += r.letter;

    // removeClass and delete flags from all letters before figuring out
    // which, if any, are part of an operator name
    Fragment(l[R] || this.parent.ends[L], r[L] || this.parent.ends[R]).each(function(el) {
      el.italicize(true).jQ.removeClass('mq-first mq-last');
      el.name = el.letter;
    });

    // check for operator names: at each position from left to right, check
    // substrings from longest to shortest
    outer: for (var i = 0, first = l[R] || this.parent.ends[L]; i < str.length; i += 1, first = first[R]) {
      for (var len = min(autoOps._maxLength, str.length - i); len > 0; len -= 1) {
        var word = str.slice(i, i + len);
        if (autoOps.hasOwnProperty(word)) {
          for (var j = 0, letter = first; j < len; j += 1, letter = letter[R]) {
            letter.italicize(false);
            var last = letter;
          }

          // if (nonOperatorSymbol(first[L])) first.jQ.addClass('mq-first');
          // if (nonOperatorSymbol(last[R])) last.jQ.addClass('mq-last');

          i += len - 1;
          first = last;
          continue outer;
        }
      }
    }
  };

  // function nonOperatorSymbol(node) {
  //   return node instanceof UnitSymbol;
  // }
});

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
