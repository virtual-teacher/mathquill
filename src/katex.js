var buildTree = require("./katex/buildTree");
var parseTree = require("./katex/parseTree");
var utils = require("./katex/utils");

module.exports = function(toParse, baseNode) {
    utils.clearNode(baseNode);

    var tree = parseTree(toParse);
    var built = buildTree(tree)
    var node = built.toNode();
    debugger;

    baseNode.appendChild(node);
};
