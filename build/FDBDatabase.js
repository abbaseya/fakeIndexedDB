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
var FDBTransaction_1 = require("./FDBTransaction");
var errors_1 = require("./lib/errors");
var fakeDOMStringList_1 = require("./lib/fakeDOMStringList");
var FakeEventTarget_1 = require("./lib/FakeEventTarget");
var ObjectStore_1 = require("./lib/ObjectStore");
var scheduling_1 = require("./lib/scheduling");
var validateKeyPath_1 = require("./lib/validateKeyPath");
var confirmActiveVersionchangeTransaction = function(database) {
    if (!database._runningVersionchangeTransaction) {
        throw new errors_1.InvalidStateError();
    }
    // Find the latest versionchange transaction
    var transactions = database._rawDatabase.transactions.filter(function(tx) {
        return tx.mode === "versionchange";
    });
    var transaction = transactions[transactions.length - 1];
    if (!transaction || transaction._state === "finished") {
        throw new errors_1.InvalidStateError();
    }
    if (transaction._state !== "active") {
        throw new errors_1.TransactionInactiveError();
    }
    return transaction;
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-closing-steps
var closeConnection = function(connection) {
    connection._closePending = true;
    var transactionsComplete = connection._rawDatabase.transactions.every(
        function(transaction) {
            return transaction._state === "finished";
        },
    );
    if (transactionsComplete) {
        connection._closed = true;
        connection._rawDatabase.connections = connection._rawDatabase.connections.filter(
            function(otherConnection) {
                return connection !== otherConnection;
            },
        );
    } else {
        scheduling_1.queueTask(function() {
            closeConnection(connection);
        });
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#database-interface
var FDBDatabase = /** @class */ (function(_super) {
    __extends(FDBDatabase, _super);
    function FDBDatabase(rawDatabase) {
        var _this = _super.call(this) || this;
        _this._closePending = false;
        _this._closed = false;
        _this._runningVersionchangeTransaction = false;
        _this._rawDatabase = rawDatabase;
        _this._rawDatabase.connections.push(_this);
        _this.name = rawDatabase.name;
        _this.version = rawDatabase.version;
        _this.objectStoreNames = fakeDOMStringList_1
            .default(Array.from(rawDatabase.rawObjectStores.keys()))
            .sort();
        return _this;
    }
    // http://w3c.github.io/IndexedDB/#dom-idbdatabase-createobjectstore
    FDBDatabase.prototype.createObjectStore = function(name, options) {
        var _this = this;
        if (options === void 0) {
            options = {};
        }
        if (name === undefined) {
            throw new TypeError();
        }
        var transaction = confirmActiveVersionchangeTransaction(this);
        var keyPath =
            options !== null && options.keyPath !== undefined
                ? options.keyPath
                : null;
        var autoIncrement =
            options !== null && options.autoIncrement !== undefined
                ? options.autoIncrement
                : false;
        if (keyPath !== null) {
            validateKeyPath_1.default(keyPath);
        }
        if (this._rawDatabase.rawObjectStores.has(name)) {
            throw new errors_1.ConstraintError();
        }
        if (autoIncrement && (keyPath === "" || Array.isArray(keyPath))) {
            throw new errors_1.InvalidAccessError();
        }
        var objectStoreNames = this.objectStoreNames.slice();
        transaction._rollbackLog.push(function() {
            var objectStore = _this._rawDatabase.rawObjectStores.get(name);
            if (objectStore) {
                objectStore.deleted = true;
            }
            _this.objectStoreNames = fakeDOMStringList_1.default(
                objectStoreNames,
            );
            transaction._scope.delete(name);
            _this._rawDatabase.rawObjectStores.delete(name);
        });
        var rawObjectStore = new ObjectStore_1.default(
            this._rawDatabase,
            name,
            keyPath,
            autoIncrement,
        );
        this.objectStoreNames.push(name);
        this.objectStoreNames.sort();
        transaction._scope.add(name);
        this._rawDatabase.rawObjectStores.set(name, rawObjectStore);
        transaction.objectStoreNames = fakeDOMStringList_1.default(
            this.objectStoreNames.slice(),
        );
        return transaction.objectStore(name);
    };
    FDBDatabase.prototype.deleteObjectStore = function(name) {
        var _this = this;
        if (name === undefined) {
            throw new TypeError();
        }
        var transaction = confirmActiveVersionchangeTransaction(this);
        var store = this._rawDatabase.rawObjectStores.get(name);
        if (store === undefined) {
            throw new errors_1.NotFoundError();
        }
        this.objectStoreNames = fakeDOMStringList_1.default(
            this.objectStoreNames.filter(function(objectStoreName) {
                return objectStoreName !== name;
            }),
        );
        transaction.objectStoreNames = fakeDOMStringList_1.default(
            this.objectStoreNames.slice(),
        );
        transaction._rollbackLog.push(function() {
            store.deleted = false;
            _this._rawDatabase.rawObjectStores.set(name, store);
            _this.objectStoreNames.push(name);
            _this.objectStoreNames.sort();
        });
        store.deleted = true;
        this._rawDatabase.rawObjectStores.delete(name);
        transaction._objectStoresCache.delete(name);
    };
    FDBDatabase.prototype.transaction = function(storeNames, mode) {
        var e_1, _a;
        var _this = this;
        mode = mode !== undefined ? mode : "readonly";
        if (
            mode !== "readonly" &&
            mode !== "readwrite" &&
            mode !== "versionchange"
        ) {
            throw new TypeError("Invalid mode: " + mode);
        }
        var hasActiveVersionchange = this._rawDatabase.transactions.some(
            function(transaction) {
                return (
                    transaction._state === "active" &&
                    transaction.mode === "versionchange" &&
                    transaction.db === _this
                );
            },
        );
        if (hasActiveVersionchange) {
            throw new errors_1.InvalidStateError();
        }
        if (this._closePending) {
            throw new errors_1.InvalidStateError();
        }
        if (!Array.isArray(storeNames)) {
            storeNames = [storeNames];
        }
        if (storeNames.length === 0 && mode !== "versionchange") {
            throw new errors_1.InvalidAccessError();
        }
        try {
            for (
                var storeNames_1 = __values(storeNames),
                    storeNames_1_1 = storeNames_1.next();
                !storeNames_1_1.done;
                storeNames_1_1 = storeNames_1.next()
            ) {
                var storeName = storeNames_1_1.value;
                if (this.objectStoreNames.indexOf(storeName) < 0) {
                    throw new errors_1.NotFoundError(
                        "No objectStore named " +
                            storeName +
                            " in this database",
                    );
                }
            }
        } catch (e_1_1) {
            e_1 = { error: e_1_1 };
        } finally {
            try {
                if (
                    storeNames_1_1 &&
                    !storeNames_1_1.done &&
                    (_a = storeNames_1.return)
                )
                    _a.call(storeNames_1);
            } finally {
                if (e_1) throw e_1.error;
            }
        }
        var tx = new FDBTransaction_1.default(storeNames, mode, this);
        this._rawDatabase.transactions.push(tx);
        this._rawDatabase.processTransactions(); // See if can start right away (async)
        return tx;
    };
    FDBDatabase.prototype.close = function() {
        closeConnection(this);
    };
    FDBDatabase.prototype.toString = function() {
        return "[object IDBDatabase]";
    };
    return FDBDatabase;
})(FakeEventTarget_1.default);
exports.default = FDBDatabase;
