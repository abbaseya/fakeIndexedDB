"use strict";
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
var FDBKeyRange_1 = require("./FDBKeyRange");
var FDBObjectStore_1 = require("./FDBObjectStore");
var cmp_1 = require("./lib/cmp");
var errors_1 = require("./lib/errors");
var extractKey_1 = require("./lib/extractKey");
var structuredClone_1 = require("./lib/structuredClone");
var valueToKey_1 = require("./lib/valueToKey");
var getEffectiveObjectStore = function(cursor) {
    if (cursor.source instanceof FDBObjectStore_1.default) {
        return cursor.source;
    }
    return cursor.source.objectStore;
};
// This takes a key range, a list of lower bounds, and a list of upper bounds and combines them all into a single key
// range. It does not handle gt/gte distinctions, because it doesn't really matter much anyway, since for next/prev
// cursor iteration it'd also have to look at values to be precise, which would be complicated. This should get us 99%
// of the way there.
var makeKeyRange = function(range, lowers, uppers) {
    var e_1, _a, e_2, _b;
    // Start with bounds from range
    var lower = range !== undefined ? range.lower : undefined;
    var upper = range !== undefined ? range.upper : undefined;
    try {
        // Augment with values from lowers and uppers
        for (
            var lowers_1 = __values(lowers), lowers_1_1 = lowers_1.next();
            !lowers_1_1.done;
            lowers_1_1 = lowers_1.next()
        ) {
            var lowerTemp = lowers_1_1.value;
            if (lowerTemp === undefined) {
                continue;
            }
            if (lower === undefined || cmp_1.default(lower, lowerTemp) === 1) {
                lower = lowerTemp;
            }
        }
    } catch (e_1_1) {
        e_1 = { error: e_1_1 };
    } finally {
        try {
            if (lowers_1_1 && !lowers_1_1.done && (_a = lowers_1.return))
                _a.call(lowers_1);
        } finally {
            if (e_1) throw e_1.error;
        }
    }
    try {
        for (
            var uppers_1 = __values(uppers), uppers_1_1 = uppers_1.next();
            !uppers_1_1.done;
            uppers_1_1 = uppers_1.next()
        ) {
            var upperTemp = uppers_1_1.value;
            if (upperTemp === undefined) {
                continue;
            }
            if (upper === undefined || cmp_1.default(upper, upperTemp) === -1) {
                upper = upperTemp;
            }
        }
    } catch (e_2_1) {
        e_2 = { error: e_2_1 };
    } finally {
        try {
            if (uppers_1_1 && !uppers_1_1.done && (_b = uppers_1.return))
                _b.call(uppers_1);
        } finally {
            if (e_2) throw e_2.error;
        }
    }
    if (lower !== undefined && upper !== undefined) {
        return FDBKeyRange_1.default.bound(lower, upper);
    }
    if (lower !== undefined) {
        return FDBKeyRange_1.default.lowerBound(lower);
    }
    if (upper !== undefined) {
        return FDBKeyRange_1.default.upperBound(upper);
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#cursor
var FDBCursor = /** @class */ (function() {
    function FDBCursor(source, range, direction, request, keyOnly) {
        if (direction === void 0) {
            direction = "next";
        }
        if (keyOnly === void 0) {
            keyOnly = false;
        }
        this._gotValue = false;
        this._position = undefined; // Key of previously returned record
        this._objectStorePosition = undefined;
        this._keyOnly = false;
        this._key = undefined;
        this._primaryKey = undefined;
        this._range = range;
        this._source = source;
        this._direction = direction;
        this._request = request;
        this._keyOnly = keyOnly;
    }
    Object.defineProperty(FDBCursor.prototype, "source", {
        // Read only properties
        get: function() {
            return this._source;
        },
        set: function(val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(FDBCursor.prototype, "direction", {
        get: function() {
            return this._direction;
        },
        set: function(val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(FDBCursor.prototype, "key", {
        get: function() {
            return this._key;
        },
        set: function(val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(FDBCursor.prototype, "primaryKey", {
        get: function() {
            return this._primaryKey;
        },
        set: function(val) {
            /* For babel */
        },
        enumerable: true,
        configurable: true,
    });
    // https://w3c.github.io/IndexedDB/#iterate-a-cursor
    FDBCursor.prototype._iterate = function(key, primaryKey) {
        var e_3, _a, e_4, _b, e_5, _c, e_6, _d;
        var sourceIsObjectStore =
            this.source instanceof FDBObjectStore_1.default;
        // Can't use sourceIsObjectStore because TypeScript
        var records =
            this.source instanceof FDBObjectStore_1.default
                ? this.source._rawObjectStore.records
                : this.source._rawIndex.records;
        var foundRecord;
        if (this.direction === "next") {
            var range = makeKeyRange(this._range, [key, this._position], []);
            try {
                for (
                    var _e = __values(records.values(range)), _f = _e.next();
                    !_f.done;
                    _f = _e.next()
                ) {
                    var record = _f.value;
                    var cmpResultKey =
                        key !== undefined
                            ? cmp_1.default(record.key, key)
                            : undefined;
                    var cmpResultPosition =
                        this._position !== undefined
                            ? cmp_1.default(record.key, this._position)
                            : undefined;
                    if (key !== undefined) {
                        if (cmpResultKey === -1) {
                            continue;
                        }
                    }
                    if (primaryKey !== undefined) {
                        if (cmpResultKey === -1) {
                            continue;
                        }
                        var cmpResultPrimaryKey = cmp_1.default(
                            record.value,
                            primaryKey,
                        );
                        if (cmpResultKey === 0 && cmpResultPrimaryKey === -1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && sourceIsObjectStore) {
                        if (cmpResultPosition !== 1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && !sourceIsObjectStore) {
                        if (cmpResultPosition === -1) {
                            continue;
                        }
                        if (
                            cmpResultPosition === 0 &&
                            cmp_1.default(
                                record.value,
                                this._objectStorePosition,
                            ) !== 1
                        ) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    foundRecord = record;
                    break;
                }
            } catch (e_3_1) {
                e_3 = { error: e_3_1 };
            } finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
                } finally {
                    if (e_3) throw e_3.error;
                }
            }
        } else if (this.direction === "nextunique") {
            // This could be done without iterating, if the range was defined slightly better (to handle gt/gte cases).
            // But the performance difference should be small, and that wouldn't work anyway for directions where the
            // value needs to be used (like next and prev).
            var range = makeKeyRange(this._range, [key, this._position], []);
            try {
                for (
                    var _g = __values(records.values(range)), _h = _g.next();
                    !_h.done;
                    _h = _g.next()
                ) {
                    var record = _h.value;
                    if (key !== undefined) {
                        if (cmp_1.default(record.key, key) === -1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined) {
                        if (cmp_1.default(record.key, this._position) !== 1) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    foundRecord = record;
                    break;
                }
            } catch (e_4_1) {
                e_4 = { error: e_4_1 };
            } finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                } finally {
                    if (e_4) throw e_4.error;
                }
            }
        } else if (this.direction === "prev") {
            var range = makeKeyRange(this._range, [], [key, this._position]);
            try {
                for (
                    var _j = __values(records.values(range, "prev")),
                        _k = _j.next();
                    !_k.done;
                    _k = _j.next()
                ) {
                    var record = _k.value;
                    var cmpResultKey =
                        key !== undefined
                            ? cmp_1.default(record.key, key)
                            : undefined;
                    var cmpResultPosition =
                        this._position !== undefined
                            ? cmp_1.default(record.key, this._position)
                            : undefined;
                    if (key !== undefined) {
                        if (cmpResultKey === 1) {
                            continue;
                        }
                    }
                    if (primaryKey !== undefined) {
                        if (cmpResultKey === 1) {
                            continue;
                        }
                        var cmpResultPrimaryKey = cmp_1.default(
                            record.value,
                            primaryKey,
                        );
                        if (cmpResultKey === 0 && cmpResultPrimaryKey === 1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && sourceIsObjectStore) {
                        if (cmpResultPosition !== -1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined && !sourceIsObjectStore) {
                        if (cmpResultPosition === 1) {
                            continue;
                        }
                        if (
                            cmpResultPosition === 0 &&
                            cmp_1.default(
                                record.value,
                                this._objectStorePosition,
                            ) !== -1
                        ) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    foundRecord = record;
                    break;
                }
            } catch (e_5_1) {
                e_5 = { error: e_5_1 };
            } finally {
                try {
                    if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
                } finally {
                    if (e_5) throw e_5.error;
                }
            }
        } else if (this.direction === "prevunique") {
            var tempRecord = void 0;
            var range = makeKeyRange(this._range, [], [key, this._position]);
            try {
                for (
                    var _l = __values(records.values(range, "prev")),
                        _m = _l.next();
                    !_m.done;
                    _m = _l.next()
                ) {
                    var record = _m.value;
                    if (key !== undefined) {
                        if (cmp_1.default(record.key, key) === 1) {
                            continue;
                        }
                    }
                    if (this._position !== undefined) {
                        if (cmp_1.default(record.key, this._position) !== -1) {
                            continue;
                        }
                    }
                    if (this._range !== undefined) {
                        if (!this._range.includes(record.key)) {
                            continue;
                        }
                    }
                    tempRecord = record;
                    break;
                }
            } catch (e_6_1) {
                e_6 = { error: e_6_1 };
            } finally {
                try {
                    if (_m && !_m.done && (_d = _l.return)) _d.call(_l);
                } finally {
                    if (e_6) throw e_6.error;
                }
            }
            if (tempRecord) {
                foundRecord = records.get(tempRecord.key);
            }
        }
        var result;
        if (!foundRecord) {
            this._key = undefined;
            if (!sourceIsObjectStore) {
                this._objectStorePosition = undefined;
            }
            // "this instanceof FDBCursorWithValue" would be better and not require (this as any), but causes runtime
            // error due to circular dependency.
            if (
                !this._keyOnly &&
                this.toString() === "[object IDBCursorWithValue]"
            ) {
                this.value = undefined;
            }
            result = null;
        } else {
            this._position = foundRecord.key;
            if (!sourceIsObjectStore) {
                this._objectStorePosition = foundRecord.value;
            }
            this._key = foundRecord.key;
            if (sourceIsObjectStore) {
                this._primaryKey = structuredClone_1.default(foundRecord.key);
                if (
                    !this._keyOnly &&
                    this.toString() === "[object IDBCursorWithValue]"
                ) {
                    this.value = structuredClone_1.default(foundRecord.value);
                }
            } else {
                this._primaryKey = structuredClone_1.default(foundRecord.value);
                if (
                    !this._keyOnly &&
                    this.toString() === "[object IDBCursorWithValue]"
                ) {
                    if (this.source instanceof FDBObjectStore_1.default) {
                        // Can't use sourceIsObjectStore because TypeScript
                        throw new Error("This should never happen");
                    }
                    var value = this.source.objectStore._rawObjectStore.getValue(
                        foundRecord.value,
                    );
                    this.value = structuredClone_1.default(value);
                }
            }
            this._gotValue = true;
            result = this;
        }
        return result;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-update-IDBRequest-any-value
    FDBCursor.prototype.update = function(value) {
        if (value === undefined) {
            throw new TypeError();
        }
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty("_rawIndex")
            ? this.primaryKey
            : this._position;
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (
            !(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted
        ) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue || !this.hasOwnProperty("value")) {
            throw new errors_1.InvalidStateError();
        }
        var clone = structuredClone_1.default(value);
        if (effectiveObjectStore.keyPath !== null) {
            var tempKey = void 0;
            try {
                tempKey = extractKey_1.default(
                    effectiveObjectStore.keyPath,
                    clone,
                );
            } catch (err) {
                /* Handled immediately below */
            }
            if (cmp_1.default(tempKey, effectiveKey) !== 0) {
                throw new errors_1.DataError();
            }
        }
        var record = {
            key: effectiveKey,
            value: clone,
        };
        return transaction._execRequestAsync({
            operation: effectiveObjectStore._rawObjectStore.storeRecord.bind(
                effectiveObjectStore._rawObjectStore,
                record,
                false,
                transaction._rollbackLog,
            ),
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-advance-void-unsigned-long-count
    FDBCursor.prototype.advance = function(count) {
        var _this = this;
        if (!Number.isInteger(count) || count <= 0) {
            throw new TypeError();
        }
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (
            !(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted
        ) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue) {
            throw new errors_1.InvalidStateError();
        }
        if (this._request) {
            this._request.readyState = "pending";
        }
        transaction._execRequestAsync({
            operation: function() {
                var result;
                for (var i = 0; i < count; i++) {
                    result = _this._iterate();
                    // Not sure why this is needed
                    if (!result) {
                        break;
                    }
                }
                return result;
            },
            request: this._request,
            source: this.source,
        });
        this._gotValue = false;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBCursor-continue-void-any-key
    FDBCursor.prototype.continue = function(key) {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (
            !(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted
        ) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue) {
            throw new errors_1.InvalidStateError();
        }
        if (key !== undefined) {
            key = valueToKey_1.default(key);
            var cmpResult = cmp_1.default(key, this._position);
            if (
                (cmpResult <= 0 &&
                    (this.direction === "next" ||
                        this.direction === "nextunique")) ||
                (cmpResult >= 0 &&
                    (this.direction === "prev" ||
                        this.direction === "prevunique"))
            ) {
                throw new errors_1.DataError();
            }
        }
        if (this._request) {
            this._request.readyState = "pending";
        }
        transaction._execRequestAsync({
            operation: this._iterate.bind(this, key),
            request: this._request,
            source: this.source,
        });
        this._gotValue = false;
    };
    // hthttps://w3c.github.io/IndexedDB/#dom-idbcursor-continueprimarykey
    FDBCursor.prototype.continuePrimaryKey = function(key, primaryKey) {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (
            !(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted
        ) {
            throw new errors_1.InvalidStateError();
        }
        if (
            this.source instanceof FDBObjectStore_1.default ||
            (this.direction !== "next" && this.direction !== "prev")
        ) {
            throw new errors_1.InvalidAccessError();
        }
        if (!this._gotValue) {
            throw new errors_1.InvalidStateError();
        }
        // Not sure about this
        if (key === undefined || primaryKey === undefined) {
            throw new errors_1.DataError();
        }
        key = valueToKey_1.default(key);
        var cmpResult = cmp_1.default(key, this._position);
        if (
            (cmpResult === -1 && this.direction === "next") ||
            (cmpResult === 1 && this.direction === "prev")
        ) {
            throw new errors_1.DataError();
        }
        var cmpResult2 = cmp_1.default(primaryKey, this._objectStorePosition);
        if (cmpResult === 0) {
            if (
                (cmpResult2 <= 0 && this.direction === "next") ||
                (cmpResult2 >= 0 && this.direction === "prev")
            ) {
                throw new errors_1.DataError();
            }
        }
        if (this._request) {
            this._request.readyState = "pending";
        }
        transaction._execRequestAsync({
            operation: this._iterate.bind(this, key, primaryKey),
            request: this._request,
            source: this.source,
        });
        this._gotValue = false;
    };
    FDBCursor.prototype.delete = function() {
        var effectiveObjectStore = getEffectiveObjectStore(this);
        var effectiveKey = this.source.hasOwnProperty("_rawIndex")
            ? this.primaryKey
            : this._position;
        var transaction = effectiveObjectStore.transaction;
        if (transaction._state !== "active") {
            throw new errors_1.TransactionInactiveError();
        }
        if (transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        if (effectiveObjectStore._rawObjectStore.deleted) {
            throw new errors_1.InvalidStateError();
        }
        if (
            !(this.source instanceof FDBObjectStore_1.default) &&
            this.source._rawIndex.deleted
        ) {
            throw new errors_1.InvalidStateError();
        }
        if (!this._gotValue || !this.hasOwnProperty("value")) {
            throw new errors_1.InvalidStateError();
        }
        return transaction._execRequestAsync({
            operation: effectiveObjectStore._rawObjectStore.deleteRecord.bind(
                effectiveObjectStore._rawObjectStore,
                effectiveKey,
                transaction._rollbackLog,
            ),
            source: this,
        });
    };
    FDBCursor.prototype.toString = function() {
        return "[object IDBCursor]";
    };
    return FDBCursor;
})();
exports.default = FDBCursor;
