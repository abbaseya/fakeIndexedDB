"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var MAX_KEY = 9007199254740992;
var KeyGenerator = /** @class */ (function() {
    function KeyGenerator() {
        // This is kind of wrong. Should start at 1 and increment only after record is saved
        this.num = 0;
    }
    KeyGenerator.prototype.next = function() {
        if (this.num >= MAX_KEY) {
            throw new errors_1.ConstraintError();
        }
        this.num += 1;
        return this.num;
    };
    // https://w3c.github.io/IndexedDB/#possibly-update-the-key-generator
    KeyGenerator.prototype.setIfLarger = function(num) {
        var value = Math.floor(Math.min(num, MAX_KEY)) - 1;
        if (value >= this.num) {
            this.num = value + 1;
        }
    };
    return KeyGenerator;
})();
exports.default = KeyGenerator;
