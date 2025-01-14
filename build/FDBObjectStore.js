"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBCursor_1 = require("./FDBCursor");
var FDBCursorWithValue_1 = require("./FDBCursorWithValue");
var FDBIndex_1 = require("./FDBIndex");
var FDBKeyRange_1 = require("./FDBKeyRange");
var FDBRequest_1 = require("./FDBRequest");
var canInjectKey_1 = require("./lib/canInjectKey");
var enforceRange_1 = require("./lib/enforceRange");
var errors_1 = require("./lib/errors");
var extractKey_1 = require("./lib/extractKey");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var Index_1 = require("./lib/Index");
var structuredClone_1 = require("./lib/structuredClone");
var validateKeyPath_1 = require("./lib/validateKeyPath");
var valueToKey_1 = require("./lib/valueToKey");
var valueToKeyRange_1 = require("./lib/valueToKeyRange");
var confirmActiveTransaction = function(objectStore) {
    if (objectStore._rawObjectStore.deleted) {
        throw new errors_1.InvalidStateError();
    }
    if (objectStore.transaction._state !== "active") {
        throw new errors_1.TransactionInactiveError();
    }
};
var buildRecordAddPut = function(objectStore, value, key) {
    confirmActiveTransaction(objectStore);
    if (objectStore.transaction.mode === "readonly") {
        throw new errors_1.ReadOnlyError();
    }
    if (objectStore.keyPath !== null) {
        if (key !== undefined) {
            throw new errors_1.DataError();
        }
    }
    var clone = structuredClone_1.default(value);
    if (objectStore.keyPath !== null) {
        var tempKey = extractKey_1.default(objectStore.keyPath, clone);
        if (tempKey !== undefined) {
            valueToKey_1.default(tempKey);
        } else {
            if (!objectStore._rawObjectStore.keyGenerator) {
                throw new errors_1.DataError();
            } else if (!canInjectKey_1.default(objectStore.keyPath, clone)) {
                throw new errors_1.DataError();
            }
        }
    }
    if (
        objectStore.keyPath === null &&
        objectStore._rawObjectStore.keyGenerator === null &&
        key === undefined
    ) {
        throw new errors_1.DataError();
    }
    if (key !== undefined) {
        key = valueToKey_1.default(key);
    }
    return {
        key: key,
        value: clone,
    };
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#object-store
var FDBObjectStore = /** @class */ (function() {
    function FDBObjectStore(transaction, rawObjectStore) {
        this._indexesCache = new Map();
        this._rawObjectStore = rawObjectStore;
        this._name = rawObjectStore.name;
        this.keyPath = rawObjectStore.keyPath;
        this.autoIncrement = rawObjectStore.autoIncrement;
        this.transaction = transaction;
        this.indexNames = fakeDOMStringList_1
            .default(Array.from(rawObjectStore.rawIndexes.keys()))
            .sort();
    }
    Object.defineProperty(FDBObjectStore.prototype, "name", {
        get: function() {
            return this._name;
        },
        // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-name
        set: function(name) {
            var _this = this;
            var transaction = this.transaction;
            if (!transaction.db._runningVersionchangeTransaction) {
                throw new errors_1.InvalidStateError();
            }
            confirmActiveTransaction(this);
            name = String(name);
            if (name === this._name) {
                return;
            }
            if (this._rawObjectStore.rawDatabase.rawObjectStores.has(name)) {
                throw new errors_1.ConstraintError();
            }
            var oldName = this._name;
            var oldObjectStoreNames = transaction.db.objectStoreNames.slice();
            this._name = name;
            this._rawObjectStore.name = name;
            this.transaction._objectStoresCache.delete(oldName);
            this.transaction._objectStoresCache.set(name, this);
            this._rawObjectStore.rawDatabase.rawObjectStores.delete(oldName);
            this._rawObjectStore.rawDatabase.rawObjectStores.set(
                name,
                this._rawObjectStore,
            );
            transaction.db.objectStoreNames = fakeDOMStringList_1
                .default(
                    Array.from(
                        this._rawObjectStore.rawDatabase.rawObjectStores.keys(),
                    ).filter(function(objectStoreName) {
                        var objectStore = _this._rawObjectStore.rawDatabase.rawObjectStores.get(
                            objectStoreName,
                        );
                        return objectStore && !objectStore.deleted;
                    }),
                )
                .sort();
            var oldScope = new Set(transaction._scope);
            var oldTransactionObjectStoreNames = transaction.objectStoreNames.slice();
            this.transaction._scope.delete(oldName);
            transaction._scope.add(name);
            transaction.objectStoreNames = fakeDOMStringList_1.default(
                Array.from(transaction._scope).sort(),
            );
            transaction._rollbackLog.push(function() {
                _this._name = oldName;
                _this._rawObjectStore.name = oldName;
                _this.transaction._objectStoresCache.delete(name);
                _this.transaction._objectStoresCache.set(oldName, _this);
                _this._rawObjectStore.rawDatabase.rawObjectStores.delete(name);
                _this._rawObjectStore.rawDatabase.rawObjectStores.set(
                    oldName,
                    _this._rawObjectStore,
                );
                transaction.db.objectStoreNames = fakeDOMStringList_1.default(
                    oldObjectStoreNames,
                );
                transaction._scope = oldScope;
                transaction.objectStoreNames = fakeDOMStringList_1.default(
                    oldTransactionObjectStoreNames,
                );
            });
        },
        enumerable: true,
        configurable: true,
    });
    FDBObjectStore.prototype.put = function(value, key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        var record = buildRecordAddPut(this, value, key);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.storeRecord.bind(
                this._rawObjectStore,
                record,
                false,
                this.transaction._rollbackLog,
            ),
            source: this,
        });
    };
    FDBObjectStore.prototype.add = function(value, key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        var record = buildRecordAddPut(this, value, key);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.storeRecord.bind(
                this._rawObjectStore,
                record,
                true,
                this.transaction._rollbackLog,
            ),
            source: this,
        });
    };
    FDBObjectStore.prototype.delete = function(key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        confirmActiveTransaction(this);
        if (this.transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.deleteRecord.bind(
                this._rawObjectStore,
                key,
                this.transaction._rollbackLog,
            ),
            source: this,
        });
    };
    FDBObjectStore.prototype.get = function(key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getValue.bind(
                this._rawObjectStore,
                key,
            ),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-getall
    FDBObjectStore.prototype.getAll = function(query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getAllValues.bind(
                this._rawObjectStore,
                range,
                count,
            ),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-getkey
    FDBObjectStore.prototype.getKey = function(key) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        confirmActiveTransaction(this);
        if (!(key instanceof FDBKeyRange_1.default)) {
            key = valueToKey_1.default(key);
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getKey.bind(
                this._rawObjectStore,
                key,
            ),
            source: this,
        });
    };
    // http://w3c.github.io/IndexedDB/#dom-idbobjectstore-getallkeys
    FDBObjectStore.prototype.getAllKeys = function(query, count) {
        if (arguments.length > 1 && count !== undefined) {
            count = enforceRange_1.default(count, "unsigned long");
        }
        confirmActiveTransaction(this);
        var range = valueToKeyRange_1.default(query);
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.getAllKeys.bind(
                this._rawObjectStore,
                range,
                count,
            ),
            source: this,
        });
    };
    FDBObjectStore.prototype.clear = function() {
        confirmActiveTransaction(this);
        if (this.transaction.mode === "readonly") {
            throw new errors_1.ReadOnlyError();
        }
        return this.transaction._execRequestAsync({
            operation: this._rawObjectStore.clear.bind(
                this._rawObjectStore,
                this.transaction._rollbackLog,
            ),
            source: this,
        });
    };
    FDBObjectStore.prototype.openCursor = function(range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.transaction;
        var cursor = new FDBCursorWithValue_1.default(
            this,
            range,
            direction,
            request,
        );
        return this.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    FDBObjectStore.prototype.openKeyCursor = function(range, direction) {
        confirmActiveTransaction(this);
        if (range === null) {
            range = undefined;
        }
        if (range !== undefined && !(range instanceof FDBKeyRange_1.default)) {
            range = FDBKeyRange_1.default.only(valueToKey_1.default(range));
        }
        var request = new FDBRequest_1.default();
        request.source = this;
        request.transaction = this.transaction;
        var cursor = new FDBCursor_1.default(
            this,
            range,
            direction,
            request,
            true,
        );
        return this.transaction._execRequestAsync({
            operation: cursor._iterate.bind(cursor),
            request: request,
            source: this,
        });
    };
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBObjectStore-createIndex-IDBIndex-DOMString-name-DOMString-sequence-DOMString--keyPath-IDBIndexParameters-optionalParameters
    FDBObjectStore.prototype.createIndex = function(
        name,
        keyPath,
        optionalParameters,
    ) {
        var _this = this;
        if (optionalParameters === void 0) {
            optionalParameters = {};
        }
        if (arguments.length < 2) {
            throw new TypeError();
        }
        var multiEntry =
            optionalParameters.multiEntry !== undefined
                ? optionalParameters.multiEntry
                : false;
        var unique =
            optionalParameters.unique !== undefined
                ? optionalParameters.unique
                : false;
        if (this.transaction.mode !== "versionchange") {
            throw new errors_1.InvalidStateError();
        }
        confirmActiveTransaction(this);
        if (this.indexNames.indexOf(name) >= 0) {
            throw new errors_1.ConstraintError();
        }
        validateKeyPath_1.default(keyPath);
        if (Array.isArray(keyPath) && multiEntry) {
            throw new errors_1.InvalidAccessError();
        }
        // The index that is requested to be created can contain constraints on the data allowed in the index's
        // referenced object store, such as requiring uniqueness of the values referenced by the index's keyPath. If the
        // referenced object store already contains data which violates these constraints, this MUST NOT cause the
        // implementation of createIndex to throw an exception or affect what it returns. The implementation MUST still
        // create and return an IDBIndex object. Instead the implementation must queue up an operation to abort the
        // "versionchange" transaction which was used for the createIndex call.
        var indexNames = this.indexNames.slice();
        this.transaction._rollbackLog.push(function() {
            var index2 = _this._rawObjectStore.rawIndexes.get(name);
            if (index2) {
                index2.deleted = true;
            }
            _this.indexNames = fakeDOMStringList_1.default(indexNames);
            _this._rawObjectStore.rawIndexes.delete(name);
        });
        var index = new Index_1.default(
            this._rawObjectStore,
            name,
            keyPath,
            multiEntry,
            unique,
        );
        this.indexNames.push(name);
        this.indexNames.sort();
        this._rawObjectStore.rawIndexes.set(name, index);
        index.initialize(this.transaction); // This is async by design
        return new FDBIndex_1.default(this, index);
    };
    // https://w3c.github.io/IndexedDB/#dom-idbobjectstore-index
    FDBObjectStore.prototype.index = function(name) {
        if (arguments.length === 0) {
            throw new TypeError();
        }
        if (
            this._rawObjectStore.deleted ||
            this.transaction._state === "finished"
        ) {
            throw new errors_1.InvalidStateError();
        }
        var index = this._indexesCache.get(name);
        if (index !== undefined) {
            return index;
        }
        var rawIndex = this._rawObjectStore.rawIndexes.get(name);
        if (this.indexNames.indexOf(name) < 0 || rawIndex === undefined) {
            throw new errors_1.NotFoundError();
        }
        var index2 = new FDBIndex_1.default(this, rawIndex);
        this._indexesCache.set(name, index2);
        return index2;
    };
    FDBObjectStore.prototype.deleteIndex = function(name) {
        var _this = this;
        if (arguments.length === 0) {
            throw new TypeError();
        }
        if (this.transaction.mode !== "versionchange") {
            throw new errors_1.InvalidStateError();
        }
        confirmActiveTransaction(this);
        var rawIndex = this._rawObjectStore.rawIndexes.get(name);
        if (rawIndex === undefined) {
            throw new errors_1.NotFoundError();
        }
        this.transaction._rollbackLog.push(function() {
            rawIndex.deleted = false;
            _this._rawObjectStore.rawIndexes.set(name, rawIndex);
            _this.indexNames.push(name);
            _this.indexNames.sort();
        });
        this.indexNames = fakeDOMStringList_1.default(
            this.indexNames.filter(function(indexName) {
                return indexName !== name;
            }),
        );
        rawIndex.deleted = true; // Not sure if this is supposed to happen synchronously
        this.transaction._execRequestAsync({
            operation: function() {
                var rawIndex2 = _this._rawObjectStore.rawIndexes.get(name);
                // Hack in case another index is given this name before this async request is processed. It'd be better
                // to have a real unique ID for each index.
                if (rawIndex === rawIndex2) {
                    _this._rawObjectStore.rawIndexes.delete(name);
                }
            },
            source: this,
        });
    };
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBObjectStore-count-IDBRequest-any-key
    FDBObjectStore.prototype.count = function(key) {
        var _this = this;
        confirmActiveTransaction(this);
        if (key === null) {
            key = undefined;
        }
        if (key !== undefined && !(key instanceof FDBKeyRange_1.default)) {
            key = FDBKeyRange_1.default.only(valueToKey_1.default(key));
        }
        return this.transaction._execRequestAsync({
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
    FDBObjectStore.prototype.toString = function() {
        return "[object IDBObjectStore]";
    };
    return FDBObjectStore;
})();
exports.default = FDBObjectStore;
