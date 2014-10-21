/*********************************
 * Symbols for Basic Mathematics
 ********************************/

var Variable = P(Symbol, function(_, super_) {
  _.init = function(ch, html) {
    super_.init.call(this, ch, '<var>'+(html || ch)+'</var>');
  };
  _.text = function() {
    var text = this.ctrlSeq;
    if (this[L] && !(this[L] instanceof Variable)
        && !(this[L] instanceof BinaryOperator))
      text = '*' + text;
    if (this[R] && !(this[R] instanceof BinaryOperator)
        && !(this[R].ctrlSeq === '^'))
      text += '*';
    return text;
  };
});

Options.p.autoCommands = { _maxLength: 0 };
optionProcessors.autoCommands = function(cmds) {
  if (!/^[a-z]+(?: [a-z]+)*$/i.test(cmds)) {
    throw '"'+cmds+'" not a space-delimited list of only letters';
  }
  var list = cmds.split(' '), dict = {}, maxLength = 0;
  for (var i = 0; i < list.length; i += 1) {
    var cmd = list[i];
    if (cmd.length < 2) {
      throw 'autocommand "'+cmd+'" not minimum length of 2';
    }
    if (UnitCmds[cmd] === OperatorName) {
      throw '"' + cmd + '" is a built-in operator name';
    }
    dict[cmd] = 1;
    maxLength = max(maxLength, cmd.length);
  }
  dict._maxLength = maxLength;
  return dict;
};

var Letter = P(Variable, function(_, super_) {
  _.init = function(ch) { return super_.init.call(this, this.letter = ch); };
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
    // undefined) and it's now a Letter, it will un-italicize everyone
    if (dir !== L && this[R] instanceof Letter) return;
    this.autoUnItalicize(opts);
  };
  _.autoUnItalicize = function(opts) {
    var autoOps = opts.unitNames;
    if (autoOps._maxLength === 0) return;
    // want longest possible operator names, so join together entire contiguous
    // sequence of letters
    var str = this.letter;
    for (var l = this[L]; l instanceof Letter; l = l[L]) str = l.letter + str;
    for (var r = this[R]; r instanceof Letter; r = r[R]) str += r.letter;

    // removeClass and delete flags from all letters before figuring out
    // which, if any, are part of an operator name
    Fragment(l[R] || this.parent.ends[L], r[L] || this.parent.ends[R]).each(function(el) {
      el.italicize(true).jQ.removeClass('mq-first mq-last');
      el.ctrlSeq = el.letter;
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

          var isBuiltIn = false;
          first.ctrlSeq = (isBuiltIn ? '\\' : '\\operatorname{') + first.ctrlSeq;
          last.ctrlSeq += (isBuiltIn ? ' ' : '}');
          if (nonOperatorSymbol(first[L])) first.jQ.addClass('mq-first');
          if (nonOperatorSymbol(last[R])) last.jQ.addClass('mq-last');

          i += len - 1;
          first = last;
          continue outer;
        }
      }
    }
  };
  function nonOperatorSymbol(node) {
    return node instanceof Symbol && !(node instanceof BinaryOperator);
  }
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
var OperatorName = P(Symbol, function(_, super_) {
  _.init = function(fn) { this.ctrlSeq = fn; };
  _.createLeftOf = function(cursor) {
    var fn = this.ctrlSeq;
    for (var i = 0; i < fn.length; i += 1) {
      Letter(fn.charAt(i)).createLeftOf(cursor);
    }
  };
  _.parser = function() {
    var fn = this.ctrlSeq;
    var block = MathBlock();
    for (var i = 0; i < fn.length; i += 1) {
      Letter(fn.charAt(i)).adopt(block, block.ends[R], 0);
    }
    return Parser.succeed(block.children());
  };
});
UnitCmds.operatorname = P(MathCommand, function(_) {
  _.createLeftOf = noop;
  _.numBlocks = function() { return 1; };
  _.parser = function() {
    return latexMathParser.block.map(function(b) { return b.children(); });
  };
});

// XXX
// VanillaSymbol's
UnitCmds[' '] = UnitCmds.space = bind(VanillaSymbol, '\\ ', ' ');

//the following are all Greek to me, but this helped a lot: http://www.ams.org/STIX/ion/stixsig03.html

// for what seems to me like [stupid reasons][1], Unicode provides
// subscripted and superscripted versions of all ten Arabic numerals,
// as well as [so-called "vulgar fractions"][2].
// Nobody really cares about most of them, but some of them actually
// predate Unicode, dating back to [ISO-8859-1][3], apparently also
// known as "Latin-1", which among other things [Windows-1252][4]
// largely coincides with, so Microsoft Word sometimes inserts them
// and they get copy-pasted into MathQuill.
//
// (Irrelevant but funny story: Windows-1252 is actually a strict
// superset of the "closely related but distinct"[3] "ISO 8859-1" --
// see the lack of a dash after "ISO"? Completely different character
// set, like elephants vs elephant seals, or "Zombies" vs "Zombie
// Redneck Torture Family". What kind of idiot would get them confused.
// People in fact got them confused so much, it was so common to
// mislabel Windows-1252 text as ISO-8859-1, that most modern web
// browsers and email clients treat the MIME charset of ISO-8859-1
// as actually Windows-1252, behavior now standard in the HTML5 spec.)
//
// [1]: http://en.wikipedia.org/wiki/Unicode_subscripts_andsuper_scripts
// [2]: http://en.wikipedia.org/wiki/Number_Forms
// [3]: http://en.wikipedia.org/wiki/ISO/IEC_8859-1
// [4]: http://en.wikipedia.org/wiki/Windows-1252
UnitCmds['¹'] = bind(LatexFragment, '^1');
UnitCmds['²'] = bind(LatexFragment, '^2');
UnitCmds['³'] = bind(LatexFragment, '^3');
UnitCmds['¼'] = bind(LatexFragment, '\\frac14');
UnitCmds['½'] = bind(LatexFragment, '\\frac12');
UnitCmds['¾'] = bind(LatexFragment, '\\frac34');

CharCmds['*'] = LatexCmds.sdot = LatexCmds.cdot =
  bind(BinaryOperator, '\\cdot ', '&middot;');
//semantically should be &sdot;, but &middot; looks better
