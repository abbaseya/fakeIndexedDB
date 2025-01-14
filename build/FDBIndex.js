"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBCursor_1 = require("./FDBCursor");
var FDBCursorWithValue_1 = require("./FDBCursorWithValue");
var FDBKeyRange_1 = require("./FDBKeyRange");
var FDBRequest_1 = require("./FDBRequest");
var enforceRange_1 = require("./lib/enforceRange");
var errors_1 = require("./lib/errors");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var valueToKey_1 = require("./lib/valueToKey");
var valueToKeyRange_1 = require("./lib/valueToKeyRange");
var confirmActiveTransaction = function(index) {
    if (index._rawIndex.deleted || index.objectStore._rawObjectStore.deleted) {
        throw new errors_1.InvalidStateError();
    }
    if (index.objectStore.transaction._state !== "active") {
        throw new errors_1.TransactionInactiveError();
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#idl-def-IDBIndex
var FDBIndex = /** @class */ (function() {
    function FDBIndex(objectStore, rawIndex) {
        this._rawIndex = rawIndex;
        this._name = rawIndex.name;
        this.objectStore = objectStore;
        this.keyPath = rawIndex.keyPath;
        this.multiEntry = rawIndex.multiEntry;
        this.unique = rawIndex.unique;
    }
    Object.defineProperty(FDBIndex.prototype, "name", {
        get: function() {
            return this._name;
        },
        // https://w3c.github.io/IndexedDB/#dom-idbindex-name
        set: function(name) {
            var _this = this;
            var transaction = this.objectStore.transaction;
            if (!transaction.db._runningVersionchangeTransaction) {
                throw new errors_1.InvalidStateError();
            }
            if (transaction._state !== "active") {
                throw new errors_1.TransactionInactiveError();
            }
            if (
                this._rawIndex.deleted ||
                this.objectStore._rawObjectStore.deleted
            ) {
                throw new errors_1.InvalidStateError();
            }
            name = String(name);
            if (name === this._name) {
                return;
            }
            if (this.objectStore.indexNames.indexOf(name) >= 0) {
                throw new errors_1.ConstraintError();
            }
            var oldName = this._name;
            var oldIndexNames = this.objectStore.indexNames.slice();
            this._name = name;
            this._rawIndex.name = name;
            this.objectStore._indexesCache.delete(oldName);
            this.objectStore._indexesCache.set(name, this);
            this.objectStore._rawObjectStore.rawIndexes.delete(oldName);
            this.objectStore._rawObjectStore.rawIndexes.set(
                name,
                this._rawIndex,
            );
            this.objectStore.indexNames = fakeDOMStringList_1
                .default(
                    Array.from(
                        this.objectStore._rawObjectStore.rawIndexes.keys(),
                    ).filter(function(indexName) {
                        var index = _this.objectStore._rawObjectStore.rawIndexes.get(
                            indexName,
                        );
                        return index && !index.deleted;
                    }),
                )
                .sort();
            transaction._rollbackLog.push(function() {
                _this._name = oldName;
                _this._rawIndex.name = oldName;
                _this.objectStore._indexesCache.delete(name);
                _this.objectStore._indexesCache.set(oldName, _this);
                _this.objectStore._rawObjectStore.rawIndexes.delete(name);
                _this.objectStore._rawObjectStore.rawIndexes.set(
                    oldName,
                    _this._rawIndex,
                );
                _this.objectStore.indexNames = fakeDOMStringList_1.default(
                    oldIndexNames,
                );
            });
        },
        enumerable: true,
        configurable: true,
    });
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openCursor-IDBRequest-any-range-IDBCursorDirection-direction
    FDBIndex.prototype.openCursor = function(range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.objectStore.transaction;
        var cursor = new FDBCursorWithValue_1.default(
            this,
            range,
            direction,
            request,
        );
        return this.objectStore.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-openKeyCursor-IDBRequest-any-range-IDBCursorDirection-direction
    FDBIndex.prototype.openKeyCursor = function(range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.objectStore.transaction;
        var cursor = new FDBCursor_1.default(
            this,
            range,
            direction,
            request,
            true,
        );
        return this.objectStore.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    FDBIndex.prototype.get = function(key) {
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getValue.bind(this._rawIndex, key),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbindex-getall
    FDBIndex.prototype.getAll = function(query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getAllValues.bind(
                this._rawIndex,
                range,
                count,
            ),
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-getKey-IDBRequest-any-key
    FDBIndex.prototype.getKey = function(key) {
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getKey.bind(this._rawIndex, key),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbindex-getallkeys
    FDBIndex.prototype.getAllKeys = function(query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.objectStore.transaction._execRequestAsync({
            operation: this._rawIndex.getAllKeys.bind(
                this._rawIndex,
                range,
                count,
            ),
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBIndex-count-IDBRequest-any-key
    FDBIndex.prototype.count = function(key) {
        var _this = this;
        confirmActiveTransaction(this);
        if (key === null) {
            key = undefined;
        }
        if (key !== undefined && !(key instanceof FDBKeyRange_1.default)) {
            key = FDBKeyRange_1.default.only(valueToKey_1.default(key));
        }
        return this.objectStore.transaction._execRequestAsync({
            operation: function() {
                var count = 0;
                var cursor = new FDBCursor_1.default(_this, key);
                while (cursor._iterate() !== null) {
                    count += 1;
                }
                return count;
            },
            source: this,
        });
    };
    FDBIndex.prototype.toString = function() {
        return "[object IDBIndex]";
    };
    return FDBIndex;
})();
exports.default = FDBIndex;
