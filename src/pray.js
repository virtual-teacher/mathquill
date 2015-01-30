var { L, R } = require("directions.js");

var pray = function() {};

function prayDirection(dir) {
  pray('a direction was passed', dir === L || dir === R);
}

function prayWellFormed(parent, leftward, rightward) {
  pray('a parent is always present', parent);
  pray('leftward is properly set up', (function() {
    // either it's empty and `rightward` is the left end child (possibly empty)
    if (!leftward) {
        return parent.ends[L] === rightward;
    }

    // or it's there and its [R] and .parent are properly set up
    return leftward[R] === rightward && leftward.parent === parent;
  })());

  pray('rightward is properly set up', (function() {
    // either it's empty and `leftward` is the right end child (possibly empty)
    if (!rightward) {
        return parent.ends[R] === leftward;
    }

    // or it's there and its [L] and .parent are properly set up
    return rightward[L] === leftward && rightward.parent === parent;
  })());
}

module.exports = {
    pray,
    prayDirection,
    prayWellFormed,
};
