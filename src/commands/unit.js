/*************************************************
 * Abstract classes of unit blocks and commands.
 ************************************************/

/* Universal unit write handler.
 *
 * Called by UnitBlock::write and UnitSup::finalizeTree.
 */
function unitWrite(cursor, ch, replacedFragment) {
  var cmd;
  if (ch.match(/^[a-zA-Z]$/)) {
    cmd = UnitLetter(ch);
  } else if (UnitCmds[ch]) {
    cmd = UnitCmds[ch](ch);
  } else if (ch.match(/^\d$/)) {
    // TODO
    cmd = UnitLetter(ch);
  } else if (ch === " ") {
    // TODO
    cmd = UnitLetter(ch);
  } else {
      // TODO - handle weird characters!
      // - angstrom, micro, degree, etc
      return;
  }

  if (replacedFragment) {
      cmd.replaces(replacedFragment);
  }

  cmd.createLeftOf(cursor);
}

/**
 * Unit tree node base class.
 * Some unit-tree-specific extensions to Node.
 * Both UnitBlock and UnitCommand descend from it.
 */
var UnitElement = P(Node, function(_, super_) {
  _.finalizeInsert = function(options, cursor) { // `cursor` param is only for
    this.postOrder('finalizeTree', options);

    // note: this order is important.
    // empty elements need the empty box provided by blur to
    // be present in order for their dimensions to be measured
    // correctly by 'reflow' handlers.
    this.postOrder('blur');

    this.postOrder('reflow');
    if (this[R].siblingCreated) this[R].siblingCreated(options, L);
    if (this[L].siblingCreated) this[L].siblingCreated(options, R);
    this.bubble('reflow');
  };
});

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
var UnitCommand = P(UnitElement, function(_, super_) {
  _.init = function(name) {
    super_.init.call(this);

    if (!this.name) {
        this.name = name;
    }
  };

  // obvious methods
  _.replaces = function(replacedFragment) {
    replacedFragment.disown();
    this.replacedFragment = replacedFragment;
  };

  _.isEmpty = function() {
    return this.foldChildren(true, function(isEmpty, child) {
      return isEmpty && child.isEmpty();
    });
  };

  _.parser = function() {
    var block = latexMathParser.block;
    var self = this;

    return block.times(self.numBlocks()).map(function(blocks) {
      self.blocks = blocks;

      for (var i = 0; i < blocks.length; i += 1) {
        blocks[i].adopt(self, self.ends[R], 0);
      }

      return self;
    });
  };

  // createLeftOf(cursor) and the methods it calls
  _.createLeftOf = function(cursor) {
    var cmd = this;
    var replacedFragment = cmd.replacedFragment;

    cmd.createBlocks();
    super_.createLeftOf.call(cmd, cursor);
    if (replacedFragment) {
      replacedFragment.adopt(cmd.ends[L], 0, 0);
      replacedFragment.jQ.appendTo(cmd.ends[L].jQ);
    }
    cmd.finalizeInsert(cursor.options);
    cmd.placeCursor(cursor);
  };

  _.placeCursor = function(cursor) {
    //insert the cursor at the right end of the first empty child, searching
    //left-to-right, or if none empty, the right end child
    cursor.insAtRightEnd(this.foldChildren(this.ends[L], function(leftward, child) {
      return leftward.isEmpty() ? leftward : child;
    }));
  };

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  _.moveTowards = function(dir, cursor, updown) {
    var updownInto = updown && this[updown+'Into'];
    cursor.insAtDirEnd(-dir, updownInto || this.ends[-dir]);
  };

  _.deleteTowards = function(dir, cursor) {
    cursor.startSelection();
    this.selectTowards(dir, cursor);
    cursor.select();
  };

  _.selectTowards = function(dir, cursor) {
    cursor[-dir] = this;
    cursor[dir] = this[dir];
  };

  _.selectChildren = function() {
    return Selection(this, this);
  };

  _.unselectInto = function(dir, cursor) {
    cursor.insAtDirEnd(-dir, cursor.anticursor.ancestors[this.id]);
  };

  _.seek = function(pageX, cursor) {
    function getBounds(node) {
      var bounds = {}
      bounds[L] = node.jQ.offset().left;
      bounds[R] = bounds[L] + node.jQ.outerWidth();
      return bounds;
    }

    var cmd = this;
    var cmdBounds = getBounds(cmd);

    if (pageX < cmdBounds[L]) return cursor.insLeftOf(cmd);
    if (pageX > cmdBounds[R]) return cursor.insRightOf(cmd);

    var leftLeftBound = cmdBounds[L];
    cmd.eachChild(function(block) {
      var blockBounds = getBounds(block);
      if (pageX < blockBounds[L]) {
        // closer to this block's left bound, or the bound left of that?
        if (pageX - leftLeftBound < blockBounds[L] - pageX) {
          if (block[L]) cursor.insAtRightEnd(block[L]);
          else cursor.insLeftOf(cmd);
        }
        else cursor.insAtLeftEnd(block);
        return false;
      }
      else if (pageX > blockBounds[R]) {
        if (block[R]) leftLeftBound = blockBounds[R]; // continue to next block
        else { // last (rightmost) block
          // closer to this block's right bound, or the cmd's right bound?
          if (cmdBounds[R] - pageX < pageX - blockBounds[R]) {
            cursor.insRightOf(cmd);
          }
          else cursor.insAtRightEnd(block);
        }
      }
      else {
        block.seek(pageX, cursor);
        return false;
      }
    });
  }

  _.html = function() {
      return React.renderComponentToStaticMarkup(this.react());
  };

  _.textTemplate = [''];

  // XXX we implement latex in a bunch of places it probably doesn't make sense
  // to since it's called for every selection for not understood reasons.
  _.latex = _.text = function() {
    var cmd = this, i = 0;
    return cmd.foldChildren(cmd.textTemplate[i], function(text, child) {
      i += 1;
      var child_text = child.text();
      if (text && cmd.textTemplate[i] === '('
          && child_text[0] === '(' && child_text.slice(-1) === ')')
        return text + child_text.slice(1, -1) + cmd.textTemplate[i];
      return text + child.text() + (cmd.textTemplate[i] || '');
    });
  };
});

/**
 * Children and parent of UnitCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
var UnitBlock = P(UnitElement, function(_, super_) {
  _.init = function() {
      console.log("UnitBlock", arguments);
      super_.init.call(this, arguments);
  };
  _.join = function(methodName) {
    return this.foldChildren('', function(fold, child) {
      return fold + child[methodName]();
    });
  };

  _.react = function() {
      return React.DOM.span(
          {"data-mathquill-block-id": this.id},
          this.join('react')
      );
  };

  _.html = function() { return this.join('html'); };

  _.latex = _.text = function() {
    return this.ends[L] === this.ends[R] ?
    // XXX this errors
        // Can we just get rid of it?
      this.ends[L].text() :
      '(' + this.join('text') + ')'
    ;
  };

  _.keystroke = function(key, e, ctrlr) {
      console.log("keystroke", key);
    if (ctrlr.API.__options.spaceBehavesLikeTab &&
        (key === 'Spacebar' || key === 'Shift-Spacebar')) {
      e.preventDefault();
      ctrlr.escapeDir(key === 'Shift-Spacebar' ? L : R, key, e);
      return;
    }
    return super_.keystroke.apply(this, arguments);
  };

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  _.moveOutOf = function(dir, cursor, updown) {
    var updownInto = updown && this.parent[updown+'Into'];
    if (!updownInto && this[dir]) cursor.insAtDirEnd(-dir, this[dir]);
    else cursor.insDirOf(dir, this.parent);
  };

  _.selectOutOf = function(dir, cursor) {
    cursor.insDirOf(dir, this.parent);
  };

  _.deleteOutOf = function(dir, cursor) {
    cursor.unwrapGramp();
  };

  _.seek = function(pageX, cursor) {
    var node = this.ends[R];
    if (!node || node.jQ.offset().left + node.jQ.outerWidth() < pageX) {
      return cursor.insAtRightEnd(this);
    }

    if (pageX < this.ends[L].jQ.offset().left) {
        return cursor.insAtLeftEnd(this);
    }

    while (pageX < node.jQ.offset().left) {
        node = node[L];
    }

    return node.seek(pageX, cursor);
  };

  _.write = unitWrite;

  _.focus = function() {
    this.jQ.addClass('mq-hasCursor');
    this.jQ.removeClass('mq-empty');

    return this;
  };

  _.blur = function() {
    this.jQ.removeClass('mq-hasCursor');
    if (this.isEmpty())
      this.jQ.addClass('mq-empty');

    return this;
  };
});

var RootUnitBlock = P(UnitBlock, RootBlockMixin);
MathQuill.UnitField = APIFnFor(P(EditableField, function(_, super_) {
  _.init = function(el, opts) {
    el.addClass('mq-editable-field mq-math-mode');
    this.initRootAndEvents(RootUnitBlock(), el, opts);
  };
}));
