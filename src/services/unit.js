// TODO write all this stuff!
/* Parse just a base unit name.
 *
 * Examples: kg, mm, mmHg, mol
 */
var unitNameParser = (function() {
})();

/*
 */
var unitPowerParser;
var unitRowParser;
var unitLabelParser;

Controller.open(function(_, super_) {
    _.writeLatex = function(latex) {
    var cursor = this.notify('edit').cursor;

    var all = Parser.all;
    var eof = Parser.eof;

    var block = latexMathParser.skip(eof).or(all.result(false)).parse(latex);

    if (block && !block.isEmpty()) {
      block.children().adopt(cursor.parent, cursor[L], cursor[R]);
      var jQ = block.jQize();
      jQ.insertBefore(cursor.jQ);
      cursor[L] = block.ends[R];
      block.finalizeInsert(cursor.options, cursor);
      if (block.ends[R][R].siblingCreated) block.ends[R][R].siblingCreated(cursor.options, L);
      if (block.ends[L][L].siblingCreated) block.ends[L][L].siblingCreated(cursor.options, R);
      cursor.parent.bubble('reflow');
    }

    return this;
  };

  _.writeUnit = function(text) {
        var cursor = this.notify('edit').cursor;

        var all = Parser.all;
        var eof = Parser.eof;

        var block = unitParser.skip(eof).

        return this;
    };
});
