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
var errors_1 = require("./errors");
var extractKey_1 = require("./extractKey");
var RecordStore_1 = require("./RecordStore");
var structuredClone_1 = require("./structuredClone");
var valueToKey_1 = require("./valueToKey");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-index
var Index = /** @class */ (function() {
    function Index(rawObjectStore, name, keyPath, multiEntry, unique) {
        this.deleted = false;
        // Initialized should be used to decide whether to throw an error or abort the versionchange transaction when there is a
        // constraint
        this.initialized = false;
        this.records = new RecordStore_1.default();
        this.rawObjectStore = rawObjectStore;
        this.name = name;
        this.keyPath = keyPath;
        this.multiEntry = multiEntry;
        this.unique = unique;
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-index
    Index.prototype.getKey = function(key) {
        var record = this.records.get(key);
        return record !== undefined ? record.value : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-referenced-values-from-an-index
    Index.prototype.getAllKeys = function(range, count) {
        var e_1, _a;
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (
                var _b = __values(this.records.values(range)), _c = _b.next();
                !_c.done;
                _c = _b.next()
            ) {
                var record = _c.value;
                records.push(structuredClone_1.default(record.value));
                if (records.length >= count) {
                    break;
                }
            }
        } catch (e_1_1) {
            e_1 = { error: e_1_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_1) throw e_1.error;
            }
        }
        return records;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#index-referenced-value-retrieval-operation
    Index.prototype.getValue = function(key) {
        var record = this.records.get(key);
        return record !== undefined
            ? this.rawObjectStore.getValue(record.value)
            : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-referenced-values-from-an-index
    Index.prototype.getAllValues = function(range, count) {
        var e_2, _a;
        if (count === undefined || count === 0) {
            count = Infinity;
        }
        var records = [];
        try {
            for (
                var _b = __values(this.records.values(range)), _c = _b.next();
                !_c.done;
                _c = _b.next()
            ) {
                var record = _c.value;
                records.push(this.rawObjectStore.getValue(record.value));
                if (records.length >= count) {
                    break;
                }
            }
        } catch (e_2_1) {
            e_2 = { error: e_2_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_2) throw e_2.error;
            }
        }
        return records;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store (step 7)
    Index.prototype.storeRecord = function(newRecord) {
        var e_3, _a, e_4, _b, e_5, _c;
        var indexKey;
        try {
            indexKey = extractKey_1.default(this.keyPath, newRecord.value);
        } catch (err) {
            if (err.name === "DataError") {
                // Invalid key is not an actual error, just means we do not store an entry in this index
                return;
            }
            throw err;
        }
        if (!this.multiEntry || !Array.isArray(indexKey)) {
            try {
                valueToKey_1.default(indexKey);
            } catch (e) {
                return;
            }
        } else {
            // remove any elements from index key that are not valid keys and remove any duplicate elements from index
            // key such that only one instance of the duplicate value remains.
            var keep = [];
            try {
                for (
                    var indexKey_1 = __values(indexKey),
                        indexKey_1_1 = indexKey_1.next();
                    !indexKey_1_1.done;
                    indexKey_1_1 = indexKey_1.next()
                ) {
                    var part = indexKey_1_1.value;
                    if (keep.indexOf(part) < 0) {
                        try {
                            keep.push(valueToKey_1.default(part));
                        } catch (err) {
                            /* Do nothing */
                        }
                    }
                }
            } catch (e_3_1) {
                e_3 = { error: e_3_1 };
            } finally {
                try {
                    if (
                        indexKey_1_1 &&
                        !indexKey_1_1.done &&
                        (_a = indexKey_1.return)
                    )
                        _a.call(indexKey_1);
                } finally {
                    if (e_3) throw e_3.error;
                }
            }
            indexKey = keep;
        }
        if (!this.multiEntry || !Array.isArray(indexKey)) {
            if (this.unique) {
                var existingRecord = this.records.get(indexKey);
                if (existingRecord) {
                    throw new errors_1.ConstraintError();
                }
            }
        } else {
            if (this.unique) {
                try {
                    for (
                        var indexKey_2 = __values(indexKey),
                            indexKey_2_1 = indexKey_2.next();
                        !indexKey_2_1.done;
                        indexKey_2_1 = indexKey_2.next()
                    ) {
                        var individualIndexKey = indexKey_2_1.value;
                        var existingRecord = this.records.get(
                            individualIndexKey,
                        );
                        if (existingRecord) {
                            throw new errors_1.ConstraintError();
                        }
                    }
                } catch (e_4_1) {
                    e_4 = { error: e_4_1 };
                } finally {
                    try {
                        if (
                            indexKey_2_1 &&
                            !indexKey_2_1.done &&
                            (_b = indexKey_2.return)
                        )
                            _b.call(indexKey_2);
                    } finally {
                        if (e_4) throw e_4.error;
                    }
                }
            }
        }
        if (!this.multiEntry || !Array.isArray(indexKey)) {
            this.records.add({
                key: indexKey,
                value: newRecord.key,
            });
        } else {
            try {
                for (
                    var indexKey_3 = __values(indexKey),
                        indexKey_3_1 = indexKey_3.next();
                    !indexKey_3_1.done;
                    indexKey_3_1 = indexKey_3.next()
                ) {
                    var individualIndexKey = indexKey_3_1.value;
                    this.records.add({
                        key: individualIndexKey,
                        value: newRecord.key,
                    });
                }
            } catch (e_5_1) {
                e_5 = { error: e_5_1 };
            } finally {
                try {
                    if (
                        indexKey_3_1 &&
                        !indexKey_3_1.done &&
                        (_c = indexKey_3.return)
                    )
                        _c.call(indexKey_3);
                } finally {
                    if (e_5) throw e_5.error;
                }
            }
        }
    };
    Index.prototype.initialize = function(transaction) {
        var _this = this;
        if (this.initialized) {
            throw new Error("Index already initialized");
        }
        transaction._execRequestAsync({
            operation: function() {
                var e_6, _a;
                try {
                    try {
                        // Create index based on current value of objectstore
                        for (
                            var _b = __values(
                                    _this.rawObjectStore.records.values(),
                                ),
                                _c = _b.next();
                            !_c.done;
                            _c = _b.next()
                        ) {
                            var record = _c.value;
                            _this.storeRecord(record);
                        }
                    } catch (e_6_1) {
                        e_6 = { error: e_6_1 };
                    } finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        } finally {
                            if (e_6) throw e_6.error;
                        }
                    }
                    _this.initialized = true;
                } catch (err) {
                    // console.error(err);
                    transaction._abort(err.name);
                }
            },
            source: null,
        });
    };
    return Index;
})();
exports.default = Index;
