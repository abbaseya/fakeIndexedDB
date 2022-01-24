"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function(resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
        });
    };
var __generator =
    (this && this.__generator) ||
    function(thisArg, body) {
        var _ = {
                label: 0,
                sent: function() {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: [],
            },
            f,
            y,
            t,
            g;
        return (
            (g = { next: verb(0), throw: verb(1), return: verb(2) }),
            typeof Symbol === "function" &&
                (g[Symbol.iterator] = function() {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function(v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (
                        ((f = 1),
                        y &&
                            (t =
                                op[0] & 2
                                    ? y["return"]
                                    : op[0]
                                    ? y["throw"] ||
                                      ((t = y["return"]) && t.call(y), 0)
                                    : y.next) &&
                            !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys),
                                (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (
                                op[0] === 3 &&
                                (!t || (op[1] > t[0] && op[1] < t[3]))
                            ) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var fakeIndexedDB_1 = require("../../fakeIndexedDB");
var FDBFactory_1 = require("../../FDBFactory");
var FDBKeyRange_1 = require("../../FDBKeyRange");
describe("fakeIndexedDB Tests", function() {
    describe("Transaction Lifetime", function() {
        it("Transactions should be activated from queue based on mode", function(done) {
            var request = fakeIndexedDB_1.default.open("test" + Math.random());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", { keyPath: "key" });
                for (var i = 0; i < 10; i++) {
                    store.add({ key: i, content: "test" + i });
                }
            };
            var started = [];
            var completed = [];
            var startTx = function(db, mode, desc) {
                var tx = db.transaction("store", mode);
                tx.objectStore("store").get(1).onsuccess = function() {
                    // If this is one of the readwrite transactions or the first readonly after a readwrite, make sure
                    // we waited for all active transactions to finish before starting a new one
                    if (mode === "readwrite" || started.length === 7) {
                        assert.equal(started.length, completed.length);
                    }
                    started.push(desc);
                    // console.log("start", desc);
                    tx.objectStore("store").get(2).onsuccess = function() {
                        tx.objectStore("store").get(3).onsuccess = function() {
                            tx
                                .objectStore("store")
                                .get(4).onsuccess = function() {
                                tx
                                    .objectStore("store")
                                    .get(5).onsuccess = function() {
                                    tx.objectStore("store").get(6);
                                };
                            };
                        };
                    };
                };
                tx.oncomplete = function() {
                    completed.push(desc);
                    // console.log("done", desc);
                    if (completed.length >= 12) {
                        done();
                    }
                };
            };
            request.onsuccess = function(e) {
                var db = e.target.result;
                for (var i = 0; i < 5; i++) {
                    startTx(db, "readonly", "1-" + i);
                }
                startTx(db, "readwrite", 2);
                startTx(db, "readwrite", 3);
                for (var i = 0; i < 5; i++) {
                    startTx(db, "readonly", "4-" + i);
                }
            };
        });
    });
    describe("Transaction Rollback", function() {
        it("Rollback FDBObjectStore.add", function(done) {
            var request = fakeIndexedDB_1.default.open("test" + Math.random());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", {
                    autoIncrement: true,
                });
                for (var i = 0; i < 10; i++) {
                    store.add({ content: "test" + (i + 1) });
                }
            };
            request.onsuccess = function(e) {
                var db = e.target.result;
                var tx = db.transaction("store", "readwrite");
                tx.objectStore("store").count().onsuccess = function(e2) {
                    assert.equal(e2.target.result, 10);
                    tx.objectStore("store").add({
                        content: "SHOULD BE ROLLED BACK",
                    });
                    tx.objectStore("store").get(11).onsuccess = function(e3) {
                        assert.equal(
                            e3.target.result.content,
                            "SHOULD BE ROLLED BACK",
                        );
                        tx.abort();
                    };
                };
                var tx2 = db.transaction("store", "readwrite");
                tx2.objectStore("store").count().onsuccess = function(e2) {
                    assert.equal(e2.target.result, 10);
                    // add would fail if SHOULD BE ROLLED BACK was still there
                    tx2.objectStore("store").add({
                        content: "SHOULD BE 11TH RECORD",
                    });
                    tx2.objectStore("store").count().onsuccess = function(e3) {
                        assert.equal(e3.target.result, 11);
                    };
                    tx2.objectStore("store").get(11).onsuccess = function(e3) {
                        assert.equal(
                            e3.target.result.content,
                            "SHOULD BE 11TH RECORD",
                        );
                    };
                };
                tx2.oncomplete = function() {
                    done();
                };
            };
        });
        it("Rollback FDBObjectStore.clear", function(done) {
            var request = fakeIndexedDB_1.default.open("test" + Math.random());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", {
                    autoIncrement: true,
                });
                for (var i = 0; i < 10; i++) {
                    store.add({ content: "test" + (i + 1) });
                }
            };
            request.onsuccess = function(e) {
                var db = e.target.result;
                var tx = db.transaction("store", "readwrite");
                tx.objectStore("store").clear().onsuccess = function() {
                    tx.objectStore("store").count().onsuccess = function(e2) {
                        assert.equal(e2.target.result, 0);
                        tx.abort();
                    };
                };
                var tx2 = db.transaction("store", "readwrite");
                tx2.objectStore("store").count().onsuccess = function(e2) {
                    assert.equal(e2.target.result, 10);
                };
                tx2.oncomplete = function() {
                    done();
                };
            };
        });
        it("Rollback FDBObjectStore.delete", function(done) {
            var request = fakeIndexedDB_1.default.open("test" + Math.random());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", {
                    autoIncrement: true,
                });
                for (var i = 0; i < 10; i++) {
                    store.add({ content: "test" + (i + 1) });
                }
            };
            request.onsuccess = function(e) {
                var db = e.target.result;
                var tx = db.transaction("store", "readwrite");
                tx.objectStore("store").delete(2).onsuccess = function() {
                    tx.objectStore("store").count().onsuccess = function(e2) {
                        assert.equal(e2.target.result, 9);
                        tx.abort();
                    };
                };
                var tx2 = db.transaction("store", "readwrite");
                tx2.objectStore("store").count().onsuccess = function(e2) {
                    assert.equal(e2.target.result, 10);
                };
                tx2.oncomplete = function() {
                    done();
                };
            };
        });
        it("Rollback FDBObjectStore.put", function(done) {
            var request = fakeIndexedDB_1.default.open("test" + Math.random());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", {
                    autoIncrement: true,
                });
                for (var i = 0; i < 10; i++) {
                    store.add({ content: "test" + (i + 1) });
                }
            };
            request.onsuccess = function(e) {
                var db = e.target.result;
                var tx = db.transaction("store", "readwrite");
                tx.objectStore("store").put(
                    { content: "SHOULD BE ROLLED BACK" },
                    10,
                );
                tx.objectStore("store").get(10).onsuccess = function(e2) {
                    assert.equal(
                        e2.target.result.content,
                        "SHOULD BE ROLLED BACK",
                    );
                    tx.abort();
                };
                var tx2 = db.transaction("store", "readwrite");
                tx2.objectStore("store").get(10).onsuccess = function(e2) {
                    assert.equal(e2.target.result.content, "test10");
                };
                tx2.oncomplete = function() {
                    done();
                };
            };
        });
        it("Rollback FDBCursor.delete", function(done) {
            var request = fakeIndexedDB_1.default.open("test" + Math.random());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", {
                    autoIncrement: true,
                });
                for (var i = 0; i < 10; i++) {
                    store.add({ content: "test" + (i + 1) });
                }
            };
            request.onsuccess = function(e) {
                var db = e.target.result;
                var tx = db.transaction("store", "readwrite");
                tx.objectStore("store").openCursor(3).onsuccess = function(e2) {
                    var cursor = e2.target.result;
                    var obj = cursor.value;
                    obj.content = "SHOULD BE ROLLED BACK";
                    cursor.delete();
                    tx.objectStore("store").get(3).onsuccess = function(e3) {
                        assert.equal(e3.target.result, undefined);
                        tx.abort();
                    };
                };
                var tx2 = db.transaction("store", "readwrite");
                tx2.objectStore("store").get(3).onsuccess = function(e2) {
                    assert.equal(e2.target.result.content, "test3");
                };
                tx2.oncomplete = function() {
                    done();
                };
            };
        });
        it("Rollback FDBCursor.update", function(done) {
            var request = fakeIndexedDB_1.default.open("test" + Math.random());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", {
                    autoIncrement: true,
                });
                for (var i = 0; i < 10; i++) {
                    store.add({ content: "test" + (i + 1) });
                }
            };
            request.onsuccess = function(e) {
                var db = e.target.result;
                var tx = db.transaction("store", "readwrite");
                tx.objectStore("store").openCursor(3).onsuccess = function(e2) {
                    var cursor = e2.target.result;
                    var obj = cursor.value;
                    obj.content = "SHOULD BE ROLLED BACK";
                    cursor.update(obj);
                    tx.objectStore("store").get(3).onsuccess = function(e3) {
                        assert.equal(
                            e3.target.result.content,
                            "SHOULD BE ROLLED BACK",
                        );
                        tx.abort();
                    };
                };
                var tx2 = db.transaction("store", "readwrite");
                tx2.objectStore("store").get(3).onsuccess = function(e2) {
                    assert.equal(e2.target.result.content, "test3");
                };
                tx2.oncomplete = function() {
                    done();
                };
            };
        });
        it("Rollback of versionchange transaction", function(done) {
            var dbName = "test" + Math.random();
            var request = fakeIndexedDB_1.default.open(dbName);
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore("store", {
                    autoIncrement: true,
                });
                store.createIndex("content", "content");
                for (var i = 0; i < 10; i++) {
                    store.add({ content: "test" + (i + 1) });
                }
            };
            request.onsuccess = function(e) {
                var db0 = e.target.result;
                db0.close();
                var request2 = fakeIndexedDB_1.default.open(dbName, 2);
                request2.onupgradeneeded = function(e2) {
                    var db = e2.target.result;
                    var tx = e2.target.transaction;
                    var store = tx.objectStore("store");
                    db.createObjectStore("store2", { autoIncrement: true });
                    assert.equal(db.objectStoreNames.length, 2);
                    store.createIndex("content2", "content");
                    assert.equal(store.indexNames.length, 2);
                    store.add({ content: "SHOULD BE ROLLED BACK" });
                    store.deleteIndex("content");
                    assert.equal(store.indexNames.length, 1);
                    db.deleteObjectStore("store");
                    assert.equal(db.objectStoreNames.length, 1);
                    tx.abort();
                };
                request2.onerror = function() {
                    var request3 = fakeIndexedDB_1.default.open(dbName);
                    request3.onsuccess = function(e2) {
                        var db = e2.target.result;
                        assert.equal(db.version, 1);
                        assert.equal(db.objectStoreNames.length, 1);
                        var tx = db.transaction("store");
                        var store = tx.objectStore("store");
                        assert(!store._rawObjectStore.deleted);
                        var index = store.index("content");
                        assert(!index._rawIndex.deleted);
                        store.count().onsuccess = function(e3) {
                            assert.equal(e3.target.result, 10);
                        };
                        index.get("test2").onsuccess = function(e3) {
                            assert.deepEqual(e3.target.result, {
                                content: "test2",
                            });
                        };
                        assert.equal(store.indexNames.length, 1);
                        tx.oncomplete = function() {
                            done();
                        };
                    };
                };
            };
        });
    });
    it("should allow index where not all records have keys", function(done) {
        var request = fakeIndexedDB_1.default.open("test" + Math.random());
        request.onupgradeneeded = function(e) {
            var db = e.target.result;
            var store = db.createObjectStore("store", {
                autoIncrement: true,
            });
            store.createIndex("compound", ["a", "b"], { unique: false });
        };
        request.onsuccess = function(e) {
            var db = e.target.result;
            var tx = db.transaction("store", "readwrite");
            tx.objectStore("store").put({
                whatever: "foo",
            });
            tx.onerror = function(e2) {
                done(e2.target.error);
            };
            tx.oncomplete = function() {
                var tx2 = db.transaction("store");
                var request2 = tx2.objectStore("store").get(1);
                request2.onsuccess = function(e3) {
                    assert.deepEqual(e3.target.result, {
                        whatever: "foo",
                    });
                };
                tx2.oncomplete = function() {
                    done();
                };
            };
        };
    });
    it("properly handles compound keys (issue #18)", function(done) {
        var request = fakeIndexedDB_1.default.open("test", 3);
        request.onupgradeneeded = function() {
            var db = request.result;
            var store = db.createObjectStore("books", {
                keyPath: ["author", "isbn"],
            });
            store.createIndex("by_title", "title", { unique: true });
            store.put({
                author: "Fred",
                isbn: 123456,
                title: "Quarry Memories",
            });
            store.put({
                author: "Fred",
                isbn: 234567,
                title: "Water Buffaloes",
            });
            store.put({
                author: "Barney",
                isbn: 345678,
                title: "Bedrock Nights",
            });
        };
        request.onsuccess = function(event) {
            var db = event.target.result;
            var tx = db.transaction("books", "readwrite");
            tx
                .objectStore("books")
                .openCursor(["Fred", 123456]).onsuccess = function(event2) {
                var cursor = event2.target.result;
                cursor.value.price = 5.99;
                cursor.update(cursor.value);
            };
            tx.oncomplete = function() {
                done();
            };
        };
    });
    it("iterates correctly regardless of add order (issue #20)", function(done) {
        var request = fakeIndexedDB_1.default.open("test" + Math.random());
        request.onupgradeneeded = function(e) {
            var db2 = e.target.result;
            var collStore = db2.createObjectStore("store", { keyPath: "id" });
            collStore.createIndex("_status", "_status", { unique: false });
            collStore.add({ id: "5", _status: "created" });
            collStore.add({ id: "0", _status: "created" });
        };
        request.onsuccess = function(e) {
            var db = e.target.result;
            var txn = db.transaction(["store"]);
            var store = txn.objectStore("store");
            var request2 = store.index("_status").openCursor();
            var expected = ["0", "5"];
            request2.onsuccess = function(event) {
                var cursor = event.target.result;
                if (!cursor) {
                    assert.equal(expected.length, 0);
                    done();
                    return;
                }
                var key = cursor.key,
                    value = cursor.value;
                var expectedID = expected.shift();
                assert.equal(value.id, expectedID);
                cursor.continue();
            };
            request2.onerror = function(e2) {
                done(e2.target.error);
            };
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("handles two open requests at the same time (issue #22)", function(done) {
        var name = "test" + Math.random();
        var openDb = function(cb) {
            var request = fakeIndexedDB_1.default.open(name, 3);
            request.onupgradeneeded = function() {
                var db = request.result;
                db.createObjectStore("books", { keyPath: "isbn" });
            };
            request.onsuccess = function(event) {
                var db = event.target.result;
                if (cb) {
                    cb(db);
                }
            };
        };
        openDb();
        openDb(function(db) {
            db.transaction("books");
            done();
        });
    });
    it("correctly rolls back adding record to store when index constraint error occurs (issue #41)", function() {
        return __awaiter(void 0, void 0, void 0, function() {
            function setup() {
                /* Create database, object store, and unique index */
                return new Promise(function(resolve) {
                    fakeIndexedDB_1.default.deleteDatabase(
                        "mydb",
                    ).onsuccess = function() {
                        var openreq = fakeIndexedDB_1.default.open("mydb");
                        openreq.onupgradeneeded = function(event) {
                            var db = event.target.result;
                            var store = db.createObjectStore("mystore", {
                                autoIncrement: true,
                            });
                            store.createIndex("myindex", "indexed_attr", {
                                unique: true,
                            });
                        };
                        openreq.onsuccess = function(_event) {
                            return resolve();
                        };
                    };
                });
            }
            function put() {
                /* Put `my_object` into the db. */
                return new Promise(function(resolve) {
                    fakeIndexedDB_1.default.open("mydb").onsuccess = function(
                        event,
                    ) {
                        var db = event.target.result;
                        var tx = db.transaction(["mystore"], "readwrite");
                        var store = tx.objectStore("mystore");
                        var addreq = store.add(my_object);
                        addreq.onsuccess = function(_event) {
                            return resolve("succ");
                        };
                        addreq.onerror = function(_event) {
                            return resolve("fail");
                        };
                    };
                });
            }
            function read() {
                /* Return list of all objects in the db */
                return new Promise(function(resolve) {
                    fakeIndexedDB_1.default.open("mydb").onsuccess = function(
                        event,
                    ) {
                        var db = event.target.result;
                        var tx = db.transaction(["mystore"], "readonly");
                        var store = tx.objectStore("mystore");
                        store.getAll().onsuccess = function(event2) {
                            return resolve(event2.target.result);
                        };
                    };
                });
            }
            var my_object, _a, _b, _c, _d, _e, _f;
            return __generator(this, function(_g) {
                switch (_g.label) {
                    case 0:
                        my_object = { indexed_attr: "xxx" };
                        return [4 /*yield*/, setup()];
                    case 1:
                        _g.sent();
                        _b = (_a = assert).equal;
                        return [4 /*yield*/, put()];
                    case 2:
                        _b.apply(_a, [_g.sent(), "succ"]); // returns 'succ', as expected
                        _d = (_c = assert).equal;
                        return [4 /*yield*/, put()];
                    case 3:
                        _d.apply(_c, [_g.sent(), "fail"]); // returns 'fail', as expected
                        _f = (_e = assert).equal;
                        return [4 /*yield*/, read()];
                    case 4:
                        _f.apply(_e, [_g.sent().length, 1]); // previously returned [my_object, my_object] instead of just [my_object]
                        return [2 /*return*/];
                }
            });
        });
    });
    it("FDBObjectStore.delete works with a key range (issue #53)", function(done) {
        var openreq = fakeIndexedDB_1.default.open("test53");
        openreq.onupgradeneeded = function(event) {
            var db = event.target.result;
            var store = db.createObjectStore("items", { keyPath: "key" });
            store.put({ key: "foo.a", value: 1 });
            store.put({ key: "foo.b", value: 2 });
            store.put({ key: "bar.c", value: 3 });
        };
        openreq.onsuccess = function(event) {
            var db = event.target.result;
            db
                .transaction("items")
                .objectStore("items")
                .count().onsuccess = function(event2) {
                assert.equal(event2.target.result, 3);
                var req = db
                    .transaction("items", "readwrite")
                    .objectStore("items")
                    .delete(
                        FDBKeyRange_1.default.bound(
                            "foo.",
                            "foo.￿",
                            false,
                            false,
                        ),
                    );
                req.onsuccess = function() {
                    db
                        .transaction("items")
                        .objectStore("items")
                        .count().onsuccess = function(event3) {
                        assert.equal(event3.target.result, 1);
                        done();
                    };
                };
                req.onerror = function(event3) {
                    done(event3.target.error);
                };
            };
        };
    });
    it("properly handles processing transactions with no requests (issue #54)", function() {
        return __awaiter(void 0, void 0, void 0, function() {
            function open() {
                /* Create database and object store */
                return new Promise(function(resolve, reject) {
                    fakeIndexedDB_1.default.deleteDatabase(
                        "test1",
                    ).onsuccess = function() {
                        var openreq = fakeIndexedDB_1.default.open("test1");
                        openreq.onupgradeneeded = function(event) {
                            var db = event.target.result;
                            db.createObjectStore("table1");
                        };
                        openreq.onsuccess = function(event) {
                            var db = event.target.result;
                            resolve(db);
                        };
                        openreq.onerror = reject;
                    };
                });
            }
            function bulkGet(db, table, keys) {
                /* relevant parts of Dexie.Table.bulkGet for 0 or 1 key */
                return new Promise(function(resolve, reject) {
                    var tx = db.transaction([table], "readonly");
                    var store = tx.objectStore(table);
                    if (keys.length === 0) {
                        resolve([]);
                    } else if (keys.length === 1) {
                        var req = store.get(keys[0]);
                        req.onsuccess = function(event2) {
                            return resolve([event2.target.result]);
                        };
                        req.onerror = function() {
                            return resolve([undefined]);
                        };
                    } else {
                        reject(new Error("test bulkGet only handles one key"));
                    }
                });
            }
            var theDB, result;
            return __generator(this, function(_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, open()];
                    case 1:
                        theDB = _a.sent();
                        return [
                            4 /*yield*/,
                            Promise.all([
                                bulkGet(theDB, "table1", [1]),
                                bulkGet(theDB, "table1", []),
                                bulkGet(theDB, "table1", [3]),
                            ]),
                        ];
                    case 2:
                        result = _a.sent();
                        assert.deepEqual(result, [
                            [undefined],
                            [],
                            [undefined],
                        ]);
                        return [2 /*return*/];
                }
            });
        });
    });
    describe("Events", function() {
        it("doesn't call listeners added during a callback for the event that triggered the callback", function(done) {
            var name = "test" + Math.random();
            var called = false;
            var dummy = function() {
                called = true;
            };
            var handler = function() {
                request.addEventListener("upgradeneeded", dummy);
            };
            var request = fakeIndexedDB_1.default.open(name, 3);
            request.addEventListener("upgradeneeded", handler);
            request.addEventListener("success", function() {
                assert(!called);
                done();
            });
        });
        it("doesn't get confused by removeEventListener during callbacks", function(done) {
            var name = "test" + Math.random();
            var called = false;
            var dummy = function() {
                called = true;
            };
            var handler = function() {
                request.removeEventListener("upgradeneeded", handler);
            };
            var request = fakeIndexedDB_1.default.open(name, 3);
            request.addEventListener("upgradeneeded", handler);
            request.addEventListener("upgradeneeded", dummy);
            request.addEventListener("success", function() {
                assert(called);
                done();
            });
        });
    });
    it("confirm openCursor works (issue #60)", function(done) {
        var indexedDB = new FDBFactory_1.default();
        function idb() {
            return new Promise(function(resolve, reject) {
                indexedDB.deleteDatabase("issue60").onsuccess = function() {
                    var openreq = indexedDB.open("issue60");
                    openreq.onupgradeneeded = function(event) {
                        var db = event.target.result;
                        var albumStore = db.createObjectStore("album");
                        db.createObjectStore("photo");
                        albumStore.createIndex("albumId", "albumId");
                    };
                    openreq.onsuccess = function(event) {
                        var db = event.target.result;
                        resolve(db);
                    };
                    openreq.onerror = reject;
                };
            });
        }
        idb().then(function(db2) {
            var cursor = db2
                .transaction(["album", "photo"], "readwrite")
                .objectStore("album")
                .index("albumId")
                .openCursor();
            cursor.onsuccess = function() {
                done();
            };
        });
    });
});
