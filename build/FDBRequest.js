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
var errors_1 = require("./lib/errors");
var FakeEventTarget_1 = require("./lib/FakeEventTarget");
var FDBRequest = /** @class */ (function(_super) {
    __extends(FDBRequest, _super);
    function FDBRequest() {
        var _this = (_super !== null && _super.apply(this, arguments)) || this;
        _this._result = null;
        _this._error = null;
        _this.source = null;
        _this.transaction = null;
        _this.readyState = "pending";
        _this.onsuccess = null;
        _this.onerror = null;
        return _this;
    }
    Object.defineProperty(FDBRequest.prototype, "error", {
        get: function() {
            if (this.readyState === "pending") {
                throw new errors_1.InvalidStateError();
            }
            return this._error;
        },
        set: function(value) {
            this._error = value;
        },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(FDBRequest.prototype, "result", {
        get: function() {
            if (this.readyState === "pending") {
                throw new errors_1.InvalidStateError();
            }
            return this._result;
        },
        set: function(value) {
            this._result = value;
        },
        enumerable: true,
        configurable: true,
    });
    FDBRequest.prototype.toString = function() {
        return "[object IDBRequest]";
    };
    return FDBRequest;
})(FakeEventTarget_1.default);
exports.default = FDBRequest;
