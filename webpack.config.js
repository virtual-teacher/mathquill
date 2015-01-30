var path = require("path");

var webpack = require("webpack");

module.exports = {
    entry: "./src/index.js",
    output: {
        path: "./build",
        filename: "structured-input.js",
        library: "StructuredInput",
        libraryTarget: "umd"
    },
};
