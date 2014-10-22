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
    _.writeUnit = function(text) {
        var cursor = this.notify('edit').cursor;
        // TODO stuff goes here
        return this;
    };
});
