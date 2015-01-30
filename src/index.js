var katex = require("./katex.js");

/* The interface looks something like:
 * - bootstrap : String -> Node
 * - stringify : Node -> String
 * x containsPoint : MousePos -> Bool
 * - placeCursor : MousePos -> Maybe Cursor
 * - traverse : Cursor -> Dir -> Either (Edge Dir) Cursor
 */

module.exports = katex;
