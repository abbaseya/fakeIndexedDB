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
var FDBKeyRange_1 = require("../FDBKeyRange");
var binarySearch_1 = require("./binarySearch");
var cmp_1 = require("./cmp");
var extractKey_1 = require("./extractKey");
var RecordStore = /** @class */ (function() {
    function RecordStore(initRecords) {
        var e_1, _a;
        if (initRecords === void 0) {
            initRecords = [];
        }
        this.records = [];
        try {
            for (
                var initRecords_1 = __values(initRecords),
                    initRecords_1_1 = initRecords_1.next();
                !initRecords_1_1.done;
                initRecords_1_1 = initRecords_1.next()
            ) {
                var record = initRecords_1_1.value;
                this.add(record);
            }
        } catch (e_1_1) {
            e_1 = { error: e_1_1 };
        } finally {
            try {
                if (
                    initRecords_1_1 &&
                    !initRecords_1_1.done &&
                    (_a = initRecords_1.return)
                )
                    _a.call(initRecords_1);
            } finally {
                if (e_1) throw e_1.error;
            }
        }
    }
    RecordStore.prototype.get = function(key) {
        if (key instanceof FDBKeyRange_1.default) {
            return binarySearch_1.getByKeyRange(this.records, key);
        }
        return binarySearch_1.getByKey(this.records, key);
    };
    RecordStore.prototype.add = function(newRecord) {
        // Find where to put it so it's sorted by key
        var i;
        if (this.records.length === 0) {
            i = 0;
        } else {
            i = binarySearch_1.getIndexByKeyGTE(this.records, newRecord.key);
            if (i === -1) {
                // If no matching key, add to end
                i = this.records.length;
            } else {
                // If matching key, advance to appropriate position based on value (used in indexes)
                while (
                    i < this.records.length &&
                    cmp_1.default(this.records[i].key, newRecord.key) === 0
                ) {
                    if (
                        cmp_1.default(
                            this.records[i].value,
                            newRecord.value,
                        ) !== -1
                    ) {
                        // Record value >= newRecord value, so insert here
                        break;
                    }
                    i += 1; // Look at next record
                }
            }
        }
        this.records.splice(i, 0, newRecord);
    };
    RecordStore.prototype.delete = function(key) {
        var deletedRecords = [];
        var isRange = key instanceof FDBKeyRange_1.default;
        while (true) {
            var idx = isRange
                ? binarySearch_1.getIndexByKeyRange(this.records, key)
                : binarySearch_1.getIndexByKey(this.records, key);
            if (idx === -1) {
                break;
            }
            deletedRecords.push(this.records[idx]);
            this.records.splice(idx, 1);
        }
        return deletedRecords;
    };
    RecordStore.prototype.deleteByValue = function(key) {
        var range =
            key instanceof FDBKeyRange_1.default
                ? key
                : FDBKeyRange_1.default.only(key);
        var deletedRecords = [];
        this.records = this.records.filter(function(record) {
            var shouldDelete = range.includes(record.value);
            if (shouldDelete) {
                deletedRecords.push(record);
            }
            return !shouldDelete;
        });
        return deletedRecords;
    };
    RecordStore.prototype.clear = function() {
        var deletedRecords = this.records.slice();
        this.records = [];
        return deletedRecords;
    };
    RecordStore.prototype.values = function(range, direction) {
        var _a;
        var _this = this;
        if (direction === void 0) {
            direction = "next";
        }
        return (
            (_a = {}),
            (_a[Symbol.iterator] = function() {
                var i;
                if (direction === "next") {
                    i = 0;
                    if (range !== undefined && range.lower !== undefined) {
                        while (_this.records[i] !== undefined) {
                            var cmpResult = cmp_1.default(
                                _this.records[i].key,
                                range.lower,
                            );
                            if (
                                cmpResult === 1 ||
                                (cmpResult === 0 && !range.lowerOpen)
                            ) {
                                break;
                            }
                            i += 1;
                        }
                    }
                } else {
                    i = _this.records.length - 1;
                    if (range !== undefined && range.upper !== undefined) {
                        while (_this.records[i] !== undefined) {
                            var cmpResult = cmp_1.default(
                                _this.records[i].key,
                                range.upper,
                            );
                            if (
                                cmpResult === -1 ||
                                (cmpResult === 0 && !range.upperOpen)
                            ) {
                                break;
                            }
                            i -= 1;
                        }
                    }
                }
                return {
                    next: function() {
                        var done;
                        var value;
                        if (direction === "next") {
                            value = _this.records[i];
                            done = i >= _this.records.length;
                            i += 1;
                            if (
                                !done &&
                                range !== undefined &&
                                range.upper !== undefined
                            ) {
                                var cmpResult = cmp_1.default(
                                    value.key,
                                    range.upper,
                                );
                                done =
                                    cmpResult === 1 ||
                                    (cmpResult === 0 && range.upperOpen);
                                if (done) {
                                    value = undefined;
                                }
                            }
                        } else {
                            value = _this.records[i];
                            done = i < 0;
                            i -= 1;
                            if (
                                !done &&
                                range !== undefined &&
                                range.lower !== undefined
                            ) {
                                var cmpResult = cmp_1.default(
                                    value.key,
                                    range.lower,
                                );
                                done =
                                    cmpResult === -1 ||
                                    (cmpResult === 0 && range.lowerOpen);
                                if (done) {
                                    value = undefined;
                                }
                            }
                        }
                        // The weird "as IteratorResult<Record>" is needed because of
                        // https://github.com/Microsoft/TypeScript/issues/11375 and
                        // https://github.com/Microsoft/TypeScript/issues/2983
                        // tslint:disable-next-line no-object-literal-type-assertion
                        return {
                            done: done,
                            value: value,
                        };
                    },
                };
            }),
            _a
        );
    };
    RecordStore.prototype.getRecords = function() {
        return this.records.map(function(record) {
            return {
                key: record.key,
                value: record.value,
            };
        });
    };
    RecordStore.prototype.getIndexKeys = function(keyPath) {
        return this.records.map(function(record) {
            return keyPath ? extractKey_1.default(keyPath, record.value) : null;
        });
    };
    RecordStore.prototype.getKeys = function() {
        return this.records.map(function(record) {
            return record.key;
        });
    };
    return RecordStore;
})();
exports.default = RecordStore;
