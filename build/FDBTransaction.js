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
var __values =
    (this && this.__values) ||
    function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator,
            m = s && o[s],
            i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function() {
                    if (o && i >= o.length) o = void 0;
                    return { value: o && o[i++], done: !o };
                },
            };
        throw new TypeError(
            s ? "Object is not iterable." : "Symbol.iterator is not defined.",
        );
    };
Object.defineProperty(exports, "__esModule", { value: true });
var FDBObjectStore_1 = require("./FDBObjectStore");
var FDBRequest_1 = require("./FDBRequest");
var errors_1 = require("./lib/errors");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var FakeEvent_1 = require("./lib/FakeEvent");
var FakeEventTarget_1 = require("./lib/FakeEventTarget");
var scheduling_1 = require("./lib/scheduling");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#transaction
var FDBTransaction = /** @class */ (function(_super) {
    __extends(FDBTransaction, _super);
    function FDBTransaction(storeNames, mode, db) {
        var _this = _super.call(this) || this;
        _this._state = "active";
        _this._started = false;
        _this._rollbackLog = [];
        _this._objectStoresCache = new Map();
        _this.error = null;
        _this.onabort = null;
        _this.oncomplete = null;
        _this.onerror = null;
        _this._requests = [];
        _this._scope = new Set(storeNames);
        _this.mode = mode;
        _this.db = db;
        _this.objectStoreNames = fakeDOMStringList_1.default(
            Array.from(_this._scope).sort(),
        );
        return _this;
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-aborting-a-transaction
    FDBTransaction.prototype._abort = function(errName) {
        var e_1, _a, e_2, _b;
        var _this = this;
        try {
            for (
                var _c = __values(this._rollbackLog.reverse()), _d = _c.next();
                !_d.done;
                _d = _c.next()
            ) {
                var f = _d.value;
                f();
            }
        } catch (e_1_1) {
            e_1 = { error: e_1_1 };
        } finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            } finally {
                if (e_1) throw e_1.error;
            }
        }
        if (errName !== null) {
            var e = new Error();
            e.name = errName;
            this.error = e;
        }
        try {
            // Should this directly remove from _requests?
            for (
                var _e = __values(this._requests), _f = _e.next();
                !_f.done;
                _f = _e.next()
            ) {
                var request = _f.value.request;
                if (request.readyState !== "done") {
                    request.readyState = "done"; // This will cancel execution of this request's operation
                    if (request.source) {
                        request.result = undefined;
                        request.error = new errors_1.AbortError();
                        var event_1 = new FakeEvent_1.default("error", {
                            bubbles: true,
                            cancelable: true,
                        });
                        event_1.eventPath = [this.db, this];
                        request.dispatchEvent(event_1);
                    }
                }
            }
        } catch (e_2_1) {
            e_2 = { error: e_2_1 };
        } finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            } finally {
                if (e_2) throw e_2.error;
            }
        }
        scheduling_1.queueTask(function() {
            var event = new FakeEvent_1.default("abort", {
                bubbles: true,
                cancelable: false,
            });
            event.eventPath = [_this.db];
            _this.dispatchEvent(event);
        });
        this._state = "finished";
    };
    FDBTransaction.prototype.abort = function() {
        if (this._state === "committing" || this._state === "finished") {
            throw new errors_1.InvalidStateError();
        }
        this._state = "active";
        this._abort(null);
    };
    // http://w3c.github.io/IndexedDB/#dom-idbtransaction-objectstore
    FDBTransaction.prototype.objectStore = function(name) {
        if (this._state !== "active") {
            throw new errors_1.InvalidStateError();
        }
        var objectStore = this._objectStoresCache.get(name);
        if (objectStore !== undefined) {
            return objectStore;
        }
        var rawObjectStore = this.db._rawDatabase.rawObjectStores.get(name);
        if (!this._scope.has(name) || rawObjectStore === undefined) {
            throw new errors_1.NotFoundError();
        }
        var objectStore2 = new FDBObjectStore_1.default(this, rawObjectStore);
        this._objectStoresCache.set(name, objectStore2);
        return objectStore2;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-asynchronously-executing-a-request
    FDBTransaction.prototype._execRequestAsync = function(obj) {
        var source = obj.source;
        var operation = obj.operation;
        var request = obj.hasOwnProperty("request") ? obj.request : null;
        if (this._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        // Request should only be passed for cursors
        if (!request) {
            if (!source) {
                // Special requests like indexes that just need to run some code
                request = new FDBRequest_1.default();
            } else {
                request = new FDBRequest_1.default();
                request.source = source;
                request.transaction = source.transaction;
            }
        }
        this._requests.push({
            operation: operation,
            request: request,
        });
        return request;
    };
    FDBTransaction.prototype._start = function() {
        this._started = true;
        // Remove from request queue - cursor ones will be added back if necessary by cursor.continue and such
        var operation;
        var request;
        while (this._requests.length > 0) {
            var r = this._requests.shift();
            // This should only be false if transaction was aborted
            if (r && r.request.readyState !== "done") {
                request = r.request;
                operation = r.operation;
                break;
            }
        }
        if (request && operation) {
            if (!request.source) {
                // Special requests like indexes that just need to run some code, with error handling already built into
                // operation
                operation();
            } else {
                var defaultAction = void 0;
                var event_2;
                try {
                    var result = operation();
                    request.readyState = "done";
                    request.result = result;
                    request.error = undefined;
                    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-fire-a-success-event
                    if (this._state === "inactive") {
                        this._state = "active";
                    }
                    event_2 = new FakeEvent_1.default("success", {
                        bubbles: false,
                        cancelable: false,
                    });
                } catch (err) {
                    request.readyState = "done";
                    request.result = undefined;
                    request.error = err;
                    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-fire-an-error-event
                    if (this._state === "inactive") {
                        this._state = "active";
                    }
                    event_2 = new FakeEvent_1.default("error", {
                        bubbles: true,
                        cancelable: true,
                    });
                    defaultAction = this._abort.bind(this, err.name);
                }
                try {
                    event_2.eventPath = [this.db, this];
                    request.dispatchEvent(event_2);
                } catch (err) {
                    if (this._state !== "committing") {
                        this._abort("AbortError");
                    }
                    throw err;
                }
                // Default action of event
                if (!event_2.canceled) {
                    if (defaultAction) {
                        defaultAction();
                    }
                }
            }
            // Give it another chance for new handlers to be set before finishing
            scheduling_1.queueTask(this._start.bind(this));
            return;
        }
        // Check if transaction complete event needs to be fired
        if (this._state !== "finished") {
            this._state = "finished";
            if (!this.error) {
                var event_3 = new FakeEvent_1.default("complete");
                this.dispatchEvent(event_3);
            }
        }
    };
    FDBTransaction.prototype.commit = function() {
        if (this._state !== "active") {
            throw new errors_1.InvalidStateError();
        }
        this._state = "committing";
    };
    FDBTransaction.prototype.toString = function() {
        return "[object IDBRequest]";
    };
    return FDBTransaction;
})(FakeEventTarget_1.default);
exports.default = FDBTransaction;
