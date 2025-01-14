"use strict";
var __extends =
    (this && this.__extends) ||
    (function() {
        var extendStatics = function(d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function(d, b) {
                        d.__proto__ = b;
                    }) ||
                function(d, b) {
                    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
                };
            return extendStatics(d, b);
        };
        return function(d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype =
                b === null
                    ? Object.create(b)
                    : ((__.prototype = b.prototype), new __());
        };
    })();
Object.defineProperty(exports, "__esModule", { value: true });
var FakeEvent_1 = require("./lib/FakeEvent");
var FDBVersionChangeEvent = /** @class */ (function(_super) {
    __extends(FDBVersionChangeEvent, _super);
    function FDBVersionChangeEvent(type, parameters) {
        if (parameters === void 0) {
            parameters = {};
        }
        var _this = _super.call(this, type) || this;
        _this.newVersion =
            parameters.newVersion !== undefined ? parameters.newVersion : null;
        _this.oldVersion =
            parameters.oldVersion !== undefined ? parameters.oldVersion : 0;
        return _this;
    }
    FDBVersionChangeEvent.prototype.toString = function() {
        return "[object IDBVersionChangeEvent]";
    };
    return FDBVersionChangeEvent;
})(FakeEvent_1.default);
exports.default = FDBVersionChangeEvent;
