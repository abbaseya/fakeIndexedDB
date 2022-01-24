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
var fs = require("fs");
var errors_1 = require("./errors");
var extractKey_1 = require("./extractKey");
var KeyGenerator_1 = require("./KeyGenerator");
var RecordStore_1 = require("./RecordStore");
var structuredClone_1 = require("./structuredClone");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-object-store
var ObjectStore = /** @class */ (function() {
    function ObjectStore(rawDatabase, name, keyPath, autoIncrement) {
        var e_1, _a;
        this.deleted = false;
        this.records = new RecordStore_1.default();
        this.rawIndexes = new Map();
        this.tempDatabase = "/tmp/fakeIndexedDB";
        this.rawDatabase = rawDatabase;
        this.keyGenerator =
            autoIncrement === true ? new KeyGenerator_1.default() : null;
        this.deleted = false;
        this.name = name;
        this.keyPath = keyPath;
        this.autoIncrement = autoIncrement;
        if (fs.existsSync(this.tempDatabase)) {
            var objectStore = JSON.parse(
                fs.readFileSync(this.tempDatabase, "utf8").toString(),
            );
            this.name = objectStore.name;
            this.records = new RecordStore_1.default(objectStore.records);
            var i = 0;
            try {
                for (
                    var _b = __values(objectStore.indexes.values),
                        _c = _b.next();
                    !_c.done;
                    _c = _b.next()
                ) {
                    var rawIndexValue = _c.value;
                    this.rawIndexes.set(
                        objectStore.indexes.keys[i],
                        rawIndexValue,
                    );
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
        } else {
            this.saveObjectStore();
        }
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    ObjectStore.prototype.getKey = function(key) {
        var record = this.records.get(key);
        return record !== undefined
            ? structuredClone_1.default(record.key)
            : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-keys-from-an-object-store
    ObjectStore.prototype.getAllKeys = function(range, count) {
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
                records.push(structuredClone_1.default(record.key));
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
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-retrieving-a-value-from-an-object-store
    ObjectStore.prototype.getValue = function(key) {
        var record = this.records.get(key);
        return record !== undefined
            ? structuredClone_1.default(record.value)
            : undefined;
    };
    // http://w3c.github.io/IndexedDB/#retrieve-multiple-values-from-an-object-store
    ObjectStore.prototype.getAllValues = function(range, count) {
        var e_3, _a;
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
        } catch (e_3_1) {
            e_3 = { error: e_3_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_3) throw e_3.error;
            }
        }
        return records;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-storing-a-record-into-an-object-store
    ObjectStore.prototype.storeRecord = function(
        newRecord,
        noOverwrite,
        rollbackLog,
    ) {
        var e_4, _a;
        var _this = this;
        if (this.keyPath !== null) {
            var key = extractKey_1.default(this.keyPath, newRecord.value);
            if (key !== undefined) {
                newRecord.key = key;
            }
        }
        if (this.keyGenerator !== null && newRecord.key === undefined) {
            if (rollbackLog) {
                var keyGeneratorBefore_1 = this.keyGenerator.num;
                rollbackLog.push(function() {
                    if (_this.keyGenerator) {
                        _this.keyGenerator.num = keyGeneratorBefore_1;
                    }
                });
            }
            newRecord.key = this.keyGenerator.next();
            // Set in value if keyPath defiend but led to no key
            // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-to-assign-a-key-to-a-value-using-a-key-path
            if (this.keyPath !== null) {
                if (Array.isArray(this.keyPath)) {
                    throw new Error(
                        "Cannot have an array key path in an object store with a key generator",
                    );
                }
                var remainingKeyPath = this.keyPath;
                var object = newRecord.value;
                var identifier = void 0;
                var i = 0; // Just to run the loop at least once
                while (i >= 0) {
                    if (typeof object !== "object") {
                        throw new errors_1.DataError();
                    }
                    i = remainingKeyPath.indexOf(".");
                    if (i >= 0) {
                        identifier = remainingKeyPath.slice(0, i);
                        remainingKeyPath = remainingKeyPath.slice(i + 1);
                        if (!object.hasOwnProperty(identifier)) {
                            object[identifier] = {};
                        }
                        object = object[identifier];
                    }
                }
                identifier = remainingKeyPath;
                object[identifier] = newRecord.key;
            }
        } else if (
            this.keyGenerator !== null &&
            typeof newRecord.key === "number"
        ) {
            this.keyGenerator.setIfLarger(newRecord.key);
        }
        var existingRecord = this.records.get(newRecord.key);
        if (existingRecord) {
            if (noOverwrite) {
                throw new errors_1.ConstraintError();
            }
            this.deleteRecord(newRecord.key, rollbackLog);
        }
        this.records.add(newRecord);
        if (rollbackLog) {
            rollbackLog.push(function() {
                _this.deleteRecord(newRecord.key);
            });
        }
        try {
            // Update indexes
            for (
                var _b = __values(this.rawIndexes.values()), _c = _b.next();
                !_c.done;
                _c = _b.next()
            ) {
                var rawIndex = _c.value;
                if (rawIndex.initialized) {
                    rawIndex.storeRecord(newRecord);
                }
            }
        } catch (e_4_1) {
            e_4 = { error: e_4_1 };
        } finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
                if (e_4) throw e_4.error;
            }
        }
        this.saveObjectStore();
        return newRecord.key;
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-records-from-an-object-store
    ObjectStore.prototype.deleteRecord = function(key, rollbackLog) {
        var e_5, _a, e_6, _b;
        var _this = this;
        var deletedRecords = this.records.delete(key);
        if (rollbackLog) {
            var _loop_1 = function(record) {
                rollbackLog.push(function() {
                    _this.storeRecord(record, true);
                });
            };
            try {
                for (
                    var deletedRecords_1 = __values(deletedRecords),
                        deletedRecords_1_1 = deletedRecords_1.next();
                    !deletedRecords_1_1.done;
                    deletedRecords_1_1 = deletedRecords_1.next()
                ) {
                    var record = deletedRecords_1_1.value;
                    _loop_1(record);
                }
            } catch (e_5_1) {
                e_5 = { error: e_5_1 };
            } finally {
                try {
                    if (
                        deletedRecords_1_1 &&
                        !deletedRecords_1_1.done &&
                        (_a = deletedRecords_1.return)
                    )
                        _a.call(deletedRecords_1);
                } finally {
                    if (e_5) throw e_5.error;
                }
            }
        }
        try {
            for (
                var _c = __values(this.rawIndexes.values()), _d = _c.next();
                !_d.done;
                _d = _c.next()
            ) {
                var rawIndex = _d.value;
                rawIndex.records.deleteByValue(key);
            }
        } catch (e_6_1) {
            e_6 = { error: e_6_1 };
        } finally {
            try {
                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
            } finally {
                if (e_6) throw e_6.error;
            }
        }
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-clearing-an-object-store
    ObjectStore.prototype.clear = function(rollbackLog) {
        var e_7, _a, e_8, _b;
        var _this = this;
        var deletedRecords = this.records.clear();
        if (rollbackLog) {
            var _loop_2 = function(record) {
                rollbackLog.push(function() {
                    _this.storeRecord(record, true);
                });
            };
            try {
                for (
                    var deletedRecords_2 = __values(deletedRecords),
                        deletedRecords_2_1 = deletedRecords_2.next();
                    !deletedRecords_2_1.done;
                    deletedRecords_2_1 = deletedRecords_2.next()
                ) {
                    var record = deletedRecords_2_1.value;
                    _loop_2(record);
                }
            } catch (e_7_1) {
                e_7 = { error: e_7_1 };
            } finally {
                try {
                    if (
                        deletedRecords_2_1 &&
                        !deletedRecords_2_1.done &&
                        (_a = deletedRecords_2.return)
                    )
                        _a.call(deletedRecords_2);
                } finally {
                    if (e_7) throw e_7.error;
                }
            }
        }
        try {
            for (
                var _c = __values(this.rawIndexes.values()), _d = _c.next();
                !_d.done;
                _d = _c.next()
            ) {
                var rawIndex = _d.value;
                rawIndex.records.clear();
            }
        } catch (e_8_1) {
            e_8 = { error: e_8_1 };
        } finally {
            try {
                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
            } finally {
                if (e_8) throw e_8.error;
            }
        }
    };
    ObjectStore.prototype.saveObjectStore = function() {
        fs.writeFileSync(
            this.tempDatabase,
            JSON.stringify({
                name: this.name,
                records: this.records.getRecords(),
                indexes: {
                    keys: this.rawIndexes.keys(),
                    values: this.records.getKeys(),
                },
            }),
        );
    };
    return ObjectStore;
})();
exports.default = ObjectStore;
