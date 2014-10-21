// just a few for testing
// var sampleUnits = ["kg", "m", "s"];

// what's the strategy for write?
// * math has a single implementation in mathblock - so the root handles writes
//   and I guess math block children somehow also handle writes. It gets them
//   by checking the cursor parent.
//
// How does the cursor get a parent?
// * cursor.insAt{Dir}End calls cursor.withDirInsertAt, which sets the parent
//   to the element.

// A single atomic unit with a power. E.g. kg^2 or m.
var UnitPower = P(Node, function(_, super_) {
    _.init = function (name, power) {
        super_.init.call(this);
        this.name = name;
        this.power = power;
    };

    // TODO should this parser be here?
    _.parser = function () {
        debugger;
        var string = Parser.string;
        var regex = Parser.regex;
        var optWhitespace = Parser.optWhitespace;

        return optWhitespace
            // .then(regex(/^[A-Za-zµÅ°]/))
            .then(
            string("kg")
                .or(string("m"))
                .or(string("s"))
        );
    };

    _.html = function () {
        return React.renderComponentToStaticMarkup(this.react());
    };

    _.react = function () {
        if (this.power == null) {
            return this.name;
        } else {
            return [
                this.name,
                this.power
            ];
        }
    };

    _.seek = function(pageX, cursor) {
        // TODO
        debugger;
    };
});

// A numerator or denominator
var UnitRow = P(Node, function(_, super_) {
    _.init = function (units) {
        super_.init.call(this);
        this.units = units;
    };

    _.react = function () {
        return this.units.map(function(unit) {
            return unit.react();
        });
    };
});

var UnitAnnotation = P(Node, function(_, super_) {
    _.init = function(numerator, denominator) {
        super_.init.call(this);
        this.numerator = numerator;
        this.denominator = denominator;
    };

    _.html = function () {
        return React.renderComponentToStaticMarkup(this.react());
    };

    _.react = function() {
        if (this.denominator == null) {
            return this.numerator.react();
        } else {
            return React.DOM.div(
                {},
                [this.numerator.react(), React.DOM.hr(), this.denominator.react()]
            );
        }
    };
});

var ScientificNumber = P(Node, function(_, super_) {
    _.init = function(number) {
        super_.init.call(this);
        this.number = number;
    };

    _.jQize = function() {
        this.jQ = $(this.html());
    };

    _.html = function () {
        return React.renderComponentToStaticMarkup(this.react());
    };

    _.react = function() {
        return React.DOM.span(null, this.number);
    };

    _.deleteTowards = function(dir, cursor) {
        cursor[dir] = this.remove()[dir];
    };

    _.moveTowards = function(dir, cursor) {
        cursor.jQ.insDirOf(dir, this.jQ);
        cursor[-dir] = this;
        cursor[dir] = this[dir];
    };
});

/*
_.moveOutOf = // called by Controller::escapeDir, moveDir
_.moveTowards = // called by Controller::moveDir
_.deleteOutOf = // called by Controller::deleteDir
_.deleteTowards = // called by Controller::deleteDir
_.unselectInto = // called by Controller::selectDir
_.selectOutOf = // called by Controller::selectDir
_.selectTowards = // called by Controller::selectDir
*/

// implement moveOutOf, selectOutOf, deleteOutOf, keystroke (probably)
// join? html, text?
var RootUnitBlock = P(Node, function(_, super_) {

    // mix in handlers, setHandlers, moveOutOf, deleteOutOf, selectOutOf,
    // upOutOf, downOutOf, reflow
    RootBlockMixin(_);

    _.init = function () {
        super_.init.call(this);
    };

    _.blur = function () {
        this.jQ.removeClass('mq-hasCursor');
        if (this.isEmpty())
            this.jQ.addClass('mq-empty');

        return this;
    };

    _.focus = function () {
        this.jQ
            .addClass('mq-hasCursor')
            .removeClass('mq-empty');

        return this;
    };

    // The user just inserted the character ch.
    _.write = function (cursor, ch, replacedFragment) {
        var cmd = ScientificNumber(10);
        cmd.createLeftOf(cursor);
    };

    _.jQize = function() {
        this.jQ = $(this.html());
    };

    _.html = function() {
        return React.renderComponentToStaticMarkup(this.react());
    };

    _.react = function() {
        return React.DOM.div(
            {className: "root-unit-block"},
            this.children.map(function(child) { return child.react(); })
        );
    };

    // The user clicked at pageX (interesting that we have no y position).
    // Place cursor among our children.
    _.seek = function(pageX, cursor) {
        // use jquery to get the left and right bounds of this node, relative
        // to the page.
        function getBounds(node) {
            var bounds = {};
            bounds[L] = node.jQ.offset().left;
            bounds[R] = bounds[L] + node.jQ.outerWidth();
            return bounds;
        }

        var cmd = this;
        var cmdBounds = getBounds(cmd);

        if (pageX < cmdBounds[L]) return cursor.insLeftOf(cmd);
        if (pageX > cmdBounds[R]) return cursor.insRightOf(cmd);

        // TODO finish
        debugger;
    };

    _.RootUnitBlock = 'yes, i am';
});

MathQuill.UnitField = APIFnFor(P(EditableField, function(_) {
    _.init = function(el, opts) {
        el.addClass('mq-editable-field mq-unit-mode');
        this.initRootAndEvents(RootUnitBlock(), el, opts);
    };
}));