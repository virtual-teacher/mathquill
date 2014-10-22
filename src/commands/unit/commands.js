/***************************
 * Commands and Operators.
 **************************/

var UnitSupSub = P(UnitCommand, function(_, super_) {
  _.createLeftOf = function(cursor) {
    if (!cursor[L] && cursor.options.supSubsRequireOperand) return;
    return super_.createLeftOf.apply(this, arguments);
  };

  Options.p.charsThatBreakOutOfSupSub = '';

  _.finalizeTree = function() {
    this.ends[L].write = function(cursor, ch) {
      // Break out of super/subscripts if character matches,
      // unless it's the negative sign at the very start.
      if (cursor.options.charsThatBreakOutOfSupSub.indexOf(ch) > -1 &&
          !(ch === '-' && !cursor[L]) ) {
        cursor.insRightOf(this.parent);
      }
      UnitBlock.p.write.apply(this, arguments);
    };
  };

  _.addBlock = function(block) {
    this.sub = this.downInto = this.sup.downOutOf = block;
    block.adopt(this, 0, this.sup).upOutOf = this.sup;
    block.jQ = $('<span class="mq-sub"></span>').append(block.jQ.children())
      .attr(mqBlockId, block.id).appendTo(this.jQ.removeClass('mq-sup-only'));
    this.jQ.append('<span style="display:inline-block;width:0">&nbsp;</span>');

    cmd.sup.deleteOutOf = function(dir, cursor) {
        debugger;
      cursor.insDirOf(dir, this.parent);
      if (!this.isEmpty()) {
        cursor[-dir] = this.ends[dir];
        this.children().disown()
          .withDirAdopt(dir, cursor.parent, cursor[dir], this.parent)
          .jQ.insDirOf(dir, this.parent.jQ);
      }
      cmd.supsub = "sub";
      delete cmd.sup;
      delete cmd.upInto;
      cmd.sub.upOutOf = insLeftOfMeUnlessAtEnd;
      delete cmd.sub.deleteOutOf;
      this.remove();
    };
  };
});

UnitCmds['^'] = P(UnitSupSub, function(_, super_) {
  _.supsub = 'sup';
  _.htmlTemplate =
      '<span class="mq-supsub mq-non-leaf mq-sup-only">'
    +   '<span class="mq-sup">&0</span>'
    + '</span>'
  ;
  _.textTemplate = [ '^' ];
  _.finalizeTree = function() {
    this.upInto = this.sup = this.ends[R];
    this.sup.downOutOf = insLeftOfMeUnlessAtEnd;
    super_.finalizeTree.call(this);
  };
});

var UnitLiveFraction =
UnitCmds['/'] = P(UnitCommand, function(_, super_) {
  _.htmlTemplate =
      '<span class="mq-fraction mq-non-leaf">'
    +   '<span class="mq-numerator">&0</span>'
    +   '<span class="mq-denominator">&1</span>'
    +   '<span style="display:inline-block;width:0">&nbsp;</span>'
    + '</span>'
  ;

  _.textTemplate = ['(', '/', ')'];

  _.finalizeTree = function() {
    this.upInto = this.ends[R].upOutOf = this.ends[L];
    this.downInto = this.ends[L].downOutOf = this.ends[R];
  };

  _.createLeftOf = function(cursor) {
    var curseeeeeees = cursor;
    while (curseeeeeees.parent) {
        if (curseeeeeees instanceof UnitLiveFraction) {
            return;
        }
        curseeeeeees = curseeeeeees.parent;
    }

    if (!this.replacedFragment) {
      var leftward = cursor[L];
      while (leftward &&
        !(
          leftward instanceof (UnitCmds.text || noop) ||
          leftward.ctrlSeq === '\\ ' ||
          /^[,;:]$/.test(leftward.ctrlSeq)
        ) //lookbehind for operator
      ) leftward = leftward[L];

      if (leftward !== cursor[L]) {
        this.replaces(Fragment(leftward[R] || cursor.parent.ends[L], cursor[L]));
        cursor[L] = leftward;
      }
    }
    super_.createLeftOf.call(this, cursor);
  };
});
