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
var FDBCursor_1 = require("./FDBCursor");
var FDBCursorWithValue = /** @class */ (function(_super) {
    __extends(FDBCursorWithValue, _super);
    function FDBCursorWithValue(source, range, direction, request) {
        var _this =
            _super.call(this, source, range, direction, request) || this;
        _this.value = undefined;
        return _this;
    }
    FDBCursorWithValue.prototype.toString = function() {
        return "[object IDBCursorWithValue]";
    };
    return FDBCursorWithValue;
})(FDBCursor_1.default);
exports.default = FDBCursorWithValue;
