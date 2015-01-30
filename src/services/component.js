var HiddenTextarea = React.createClass({
    render: function() {
        return <div>
        </div>;
    },

    componentDidMount: function() {
    },

    _createTextarea: function() {
        var textareaSpan = this.textareaSpan = $('<span class="mq-textarea"></span>'),
          textarea = this.API.__options.substituteTextarea();
        if (!textarea.nodeType) {
          throw 'substituteTextarea() must return a DOM element, got ' + textarea;
        }
        textarea = this.textarea = $(textarea).appendTo(textareaSpan);

        var ctrlr = this;
        ctrlr.cursor.selectionChanged = function() { ctrlr.selectionChanged(); };
        ctrlr.container.bind('copy', function() { ctrlr.setTextareaSelection(); });
    },

    _selectionChanged: function() {
        var ctrlr = this;
        forceIERedraw(ctrlr.container[0]);

        // throttle calls to setTextareaSelection(), because setting textarea.value
        // and/or calling textarea.select() can have anomalously bad performance:
        // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
        if (ctrlr.textareaSelectionTimeout === undefined) {
          ctrlr.textareaSelectionTimeout = setTimeout(function() {
            ctrlr.setTextareaSelection();
          });
        }
    },

    _setTextareaSelection: function() {
      this.textareaSelectionTimeout = undefined;
      var latex = '';
      if (this.cursor.selection) {
        latex = this.cursor.selection.join('latex');
        if (this.API.__options.statelessClipboard) {
          // FIXME: like paste, only this works for math fields; should ask parent
          latex = '$' + latex + '$';
        }
      }
      this.selectFn(latex);
    },

    _typedText: function(ch) {
        if (ch === '\n') {
            if (this.root.handlers.enter) this.root.handlers.enter(this.API);
            return;
        }
        var cursor = this.notify().cursor;
        cursor.parent.write(cursor, ch, cursor.show().replaceSelection());
        this.scrollHoriz();
    },

    _paste: function(text) {
        if (this.API.__options.unitNames) {
            // HACK
            this.writeUnit(text).cursor.show();
            return;
        }
        // TODO: document `statelessClipboard` config option in README, after
        // making it work like it should, that is, in both text and math mode
        // (currently only works in math fields, so worse than pointless, it
        //  only gets in the way by \text{}-ifying pasted stuff and $-ifying
        //  cut/copied LaTeX)
        if (this.API.__options.statelessClipboard) {
          if (text.slice(0,1) === '$' && text.slice(-1) === '$') {
            text = text.slice(1, -1);
          }
          else {
            text = '\\text{'+text+'}';
          }
        }
        // FIXME: this always inserts math or a TextBlock, even in a RootTextBlock
        this.writeLatex(text).cursor.show();
      };
});
