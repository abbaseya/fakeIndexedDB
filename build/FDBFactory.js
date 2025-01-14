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
var __read =
    (this && this.__read) ||
    function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o),
            r,
            ar = [],
            e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        } catch (error) {
            e = { error: error };
        } finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            } finally {
                if (e) throw e.error;
            }
        }
        return ar;
    };
Object.defineProperty(exports, "__esModule", { value: true });
var FDBDatabase_1 = require("./FDBDatabase");
var FDBOpenDBRequest_1 = require("./FDBOpenDBRequest");
var FDBVersionChangeEvent_1 = require("./FDBVersionChangeEvent");
var cmp_1 = require("./lib/cmp");
var Database_1 = require("./lib/Database");
var enforceRange_1 = require("./lib/enforceRange");
var errors_1 = require("./lib/errors");
var FakeEvent_1 = require("./lib/FakeEvent");
var scheduling_1 = require("./lib/scheduling");
var waitForOthersClosedDelete = function(databases, name, openDatabases, cb) {
    var anyOpen = openDatabases.some(function(openDatabase2) {
        return !openDatabase2._closed && !openDatabase2._closePending;
    });
    if (anyOpen) {
        scheduling_1.queueTask(function() {
            return waitForOthersClosedDelete(
                databases,
                name,
                openDatabases,
                cb,
            );
        });
        return;
    }
    databases.delete(name);
    cb(null);
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-deleting-a-database
var deleteDatabase = function(databases, name, request, cb) {
    var e_1, _a;
    try {
        var db = databases.get(name);
        if (db === undefined) {
            cb(null);
            return;
        }
        db.deletePending = true;
        var openDatabases = db.connections.filter(function(connection) {
            return !connection._closed && !connection._closePending;
        });
        try {
            for (
                var openDatabases_1 = __values(openDatabases),
                    openDatabases_1_1 = openDatabases_1.next();
                !openDatabases_1_1.done;
                openDatabases_1_1 = openDatabases_1.next()
            ) {
                var openDatabase2 = openDatabases_1_1.value;
                if (!openDatabase2._closePending) {
                    var event_1 = new FDBVersionChangeEvent_1.default(
                        "versionchange",
                        {
                            newVersion: null,
                            oldVersion: db.version,
                        },
                    );
                    openDatabase2.dispatchEvent(event_1);
                }
            }
        } catch (e_1_1) {
            e_1 = { error: e_1_1 };
        } finally {
            try {
                if (
                    openDatabases_1_1 &&
                    !openDatabases_1_1.done &&
                    (_a = openDatabases_1.return)
                )
                    _a.call(openDatabases_1);
            } finally {
                if (e_1) throw e_1.error;
            }
        }
        var anyOpen = openDatabases.some(function(openDatabase3) {
            return !openDatabase3._closed && !openDatabase3._closePending;
        });
        if (request && anyOpen) {
            var event_2 = new FDBVersionChangeEvent_1.default("blocked", {
                newVersion: null,
                oldVersion: db.version,
            });
            request.dispatchEvent(event_2);
        }
        waitForOthersClosedDelete(databases, name, openDatabases, cb);
    } catch (err) {
        cb(err);
    }
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-running-a-versionchange-transaction
var runVersionchangeTransaction = function(connection, version, request, cb) {
    var e_2, _a;
    connection._runningVersionchangeTransaction = true;
    var oldVersion = connection.version;
    var openDatabases = connection._rawDatabase.connections.filter(function(
        otherDatabase,
    ) {
        return connection !== otherDatabase;
    });
    try {
        for (
            var openDatabases_2 = __values(openDatabases),
                openDatabases_2_1 = openDatabases_2.next();
            !openDatabases_2_1.done;
            openDatabases_2_1 = openDatabases_2.next()
        ) {
            var openDatabase2 = openDatabases_2_1.value;
            if (!openDatabase2._closed && !openDatabase2._closePending) {
                var event_3 = new FDBVersionChangeEvent_1.default(
                    "versionchange",
                    {
                        newVersion: version,
                        oldVersion: oldVersion,
                    },
                );
                openDatabase2.dispatchEvent(event_3);
            }
        }
    } catch (e_2_1) {
        e_2 = { error: e_2_1 };
    } finally {
        try {
            if (
                openDatabases_2_1 &&
                !openDatabases_2_1.done &&
                (_a = openDatabases_2.return)
            )
                _a.call(openDatabases_2);
        } finally {
            if (e_2) throw e_2.error;
        }
    }
    var anyOpen = openDatabases.some(function(openDatabase3) {
        return !openDatabase3._closed && !openDatabase3._closePending;
    });
    if (anyOpen) {
        var event_4 = new FDBVersionChangeEvent_1.default("blocked", {
            newVersion: version,
            oldVersion: oldVersion,
        });
        request.dispatchEvent(event_4);
    }
    var waitForOthersClosed = function() {
        var anyOpen2 = openDatabases.some(function(openDatabase2) {
            return !openDatabase2._closed && !openDatabase2._closePending;
        });
        if (anyOpen2) {
            scheduling_1.queueTask(waitForOthersClosed);
            return;
        }
        // Set the version of database to version. This change is considered part of the transaction, and so if the
        // transaction is aborted, this change is reverted.
        connection._rawDatabase.version = version;
        connection.version = version;
        // Get rid of this setImmediate?
        var transaction = connection.transaction(
            connection.objectStoreNames,
            "versionchange",
        );
        request.result = connection;
        request.readyState = "done";
        request.transaction = transaction;
        transaction._rollbackLog.push(function() {
            connection._rawDatabase.version = oldVersion;
            connection.version = oldVersion;
        });
        var event = new FDBVersionChangeEvent_1.default("upgradeneeded", {
            newVersion: version,
            oldVersion: oldVersion,
        });
        request.dispatchEvent(event);
        transaction.addEventListener("error", function() {
            connection._runningVersionchangeTransaction = false;
            // throw arguments[0].target.error;
            // console.log("error in versionchange transaction - not sure if anything needs to be done here", e.target.error.name);
        });
        transaction.addEventListener("abort", function() {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            scheduling_1.queueTask(function() {
                cb(new errors_1.AbortError());
            });
        });
        transaction.addEventListener("complete", function() {
            connection._runningVersionchangeTransaction = false;
            request.transaction = null;
            // Let other complete event handlers run before continuing
            scheduling_1.queueTask(function() {
                if (connection._closePending) {
                    cb(new errors_1.AbortError());
                } else {
                    cb(null);
                }
            });
        });
    };
    waitForOthersClosed();
};
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-steps-for-opening-a-database
var openDatabase = function(databases, name, version, request, cb) {
    var db = databases.get(name);
    if (db === undefined) {
        db = new Database_1.default(name, 0);
        databases.set(name, db);
    }
    if (version === undefined) {
        version = db.version !== 0 ? db.version : 1;
    }
    if (db.version > version) {
        return cb(new errors_1.VersionError());
    }
    var connection = new FDBDatabase_1.default(db);
    if (db.version < version) {
        runVersionchangeTransaction(connection, version, request, function(
            err,
        ) {
            if (err) {
                // DO THIS HERE: ensure that connection is closed by running the steps for closing a database connection before these
                // steps are aborted.
                return cb(err);
            }
            cb(null, connection);
        });
    } else {
        cb(null, connection);
    }
};
var FDBFactory = /** @class */ (function() {
    function FDBFactory() {
        this.cmp = cmp_1.default;
        this._databases = new Map();
    }
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-deleteDatabase-IDBOpenDBRequest-DOMString-name
    FDBFactory.prototype.deleteDatabase = function(name) {
        var _this = this;
        var request = new FDBOpenDBRequest_1.default();
        request.source = null;
        scheduling_1.queueTask(function() {
            var db = _this._databases.get(name);
            var oldVersion = db !== undefined ? db.version : 0;
            deleteDatabase(_this._databases, name, request, function(err) {
                if (err) {
                    request.error = new Error();
                    request.error.name = err.name;
                    request.readyState = "done";
                    var event_5 = new FakeEvent_1.default("error", {
                        bubbles: true,
                        cancelable: true,
                    });
                    event_5.eventPath = [];
                    request.dispatchEvent(event_5);
                    return;
                }
                request.result = undefined;
                request.readyState = "done";
                var event2 = new FDBVersionChangeEvent_1.default("success", {
                    newVersion: null,
                    oldVersion: oldVersion,
                });
                request.dispatchEvent(event2);
            });
        });
        return request;
    };
    // tslint:disable-next-line max-line-length
    // http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#widl-IDBFactory-open-IDBOpenDBRequest-DOMString-name-unsigned-long-long-version
    FDBFactory.prototype.open = function(name, version) {
        var _this = this;
        if (arguments.length > 1 && version !== undefined) {
            // Based on spec, not sure why "MAX_SAFE_INTEGER" instead of "unsigned long long", but it's needed to pass
            // tests
            version = enforceRange_1.default(version, "MAX_SAFE_INTEGER");
        }
        if (version === 0) {
            throw new TypeError();
        }
        var request = new FDBOpenDBRequest_1.default();
        request.source = null;
        scheduling_1.queueTask(function() {
            openDatabase(_this._databases, name, version, request, function(
                err,
                connection,
            ) {
                if (err) {
                    request.result = undefined;
                    request.readyState = "done";
                    request.error = new Error();
                    request.error.name = err.name;
                    var event_6 = new FakeEvent_1.default("error", {
                        bubbles: true,
                        cancelable: true,
                    });
                    event_6.eventPath = [];
                    request.dispatchEvent(event_6);
                    return;
                }
                request.result = connection;
                request.readyState = "done";
                var event2 = new FakeEvent_1.default("success");
                event2.eventPath = [];
                request.dispatchEvent(event2);
            });
        });
        return request;
    };
    // https://w3c.github.io/IndexedDB/#dom-idbfactory-databases
    FDBFactory.prototype.databases = function() {
        var _this = this;
        return new Promise(function(resolve) {
            var e_3, _a;
            var result = [];
            try {
                for (
                    var _b = __values(_this._databases), _c = _b.next();
                    !_c.done;
                    _c = _b.next()
                ) {
                    var _d = __read(_c.value, 2),
                        name_1 = _d[0],
                        database = _d[1];
                    result.push({
                        name: name_1,
                        version: database.version,
                    });
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
            resolve(result);
        });
    };
    FDBFactory.prototype.toString = function() {
        return "[object IDBFactory]";
    };
    return FDBFactory;
})();
exports.default = FDBFactory;
