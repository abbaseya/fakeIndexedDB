"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var fakeIndexedDB_1 = require("../../fakeIndexedDB");
var FDBKeyRange_1 = require("../../FDBKeyRange");
// Tests taken from https://github.com/dumbmatter/IndexedDB-getAll-shim
var db;
describe("getAll", function() {
    beforeEach(function(done) {
        var request = fakeIndexedDB_1.default.open("test" + Math.random());
        request.onupgradeneeded = function(e) {
            var db2 = e.target.result;
            var store = db2.createObjectStore("store", { keyPath: "key" });
            store.createIndex("content", "content");
            for (var i = 0; i < 10; i++) {
                store.add({ key: i, content: "test" + i });
            }
        };
        request.onsuccess = function(e) {
            db = e.target.result;
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work on object store", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAll();
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 10);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work on index", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .index("content")
            .getAll();
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 10);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work with query parameter", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAll(FDBKeyRange_1.default.bound(2, 5));
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 4);
            assert.equal(e.target.result[0].key, 2);
            assert.equal(e.target.result[3].key, 5);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work with count parameter", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAll(null, 3);
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 3);
            assert.equal(e.target.result[0].key, 0);
            assert.equal(e.target.result[2].key, 2);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work with query and count parameters", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAll(FDBKeyRange_1.default.lowerBound(6), 3);
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 3);
            assert.equal(e.target.result[0].key, 6);
            assert.equal(e.target.result[2].key, 8);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("throws InvalidStateError when store has been deleted", function(done) {
        db.close();
        var store;
        var request = fakeIndexedDB_1.default.open(db.name, 2);
        request.onupgradeneeded = function(e) {
            var db2 = e.target.result;
            var tx = e.target.transaction;
            store = tx.objectStore("store");
            db2.deleteObjectStore("store");
        };
        request.onsuccess = function(e) {
            assert.throws(function() {
                store.getAll();
            }, /InvalidStateError/);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("throws TransactionInactiveError on aborted transaction", function() {
        var tx = db.transaction("store");
        var store = tx.objectStore("store");
        tx.abort();
        assert.throws(function() {
            store.getAll();
        }, /TransactionInactiveError/);
    });
    it("throws DataError when using invalid key", function() {
        assert.throws(function() {
            db.transaction("store")
                .objectStore("store")
                .getAll(NaN);
        }, /DataError/);
    });
});
describe("getAllKeys", function() {
    beforeEach(function(done) {
        var request = fakeIndexedDB_1.default.open("test" + Math.random());
        request.onupgradeneeded = function(e) {
            var db2 = e.target.result;
            var store = db2.createObjectStore("store", { keyPath: "key" });
            store.createIndex("content", "content");
            for (var i = 0; i < 10; i++) {
                store.add({ key: i, content: "test" + i });
            }
        };
        request.onsuccess = function(e) {
            db = e.target.result;
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work on object store", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAllKeys();
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 10);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work on index", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .index("content")
            .getAllKeys();
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 10);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work with query parameter", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAllKeys(FDBKeyRange_1.default.bound(2, 5));
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 4);
            assert.equal(e.target.result[0], 2);
            assert.equal(e.target.result[3], 5);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work with count parameter", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAllKeys(null, 3);
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 3);
            assert.equal(e.target.result[0], 0);
            assert.equal(e.target.result[2], 2);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("should work with query and count parameters", function(done) {
        var request = db
            .transaction("store")
            .objectStore("store")
            .getAllKeys(FDBKeyRange_1.default.lowerBound(6), 3);
        request.onsuccess = function(e) {
            assert.equal(e.target.result.length, 3);
            assert.equal(e.target.result[0], 6);
            assert.equal(e.target.result[2], 8);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("throws InvalidStateError when store has been deleted", function(done) {
        db.close();
        var store;
        var request = fakeIndexedDB_1.default.open(db.name, 2);
        request.onupgradeneeded = function(e) {
            var db2 = e.target.result;
            var tx = e.target.transaction;
            store = tx.objectStore("store");
            db2.deleteObjectStore("store");
        };
        request.onsuccess = function(e) {
            assert.throws(function() {
                store.getAllKeys();
            }, /InvalidStateError/);
            done();
        };
        request.onerror = function(e) {
            done(e.target.error);
        };
    });
    it("throws TransactionInactiveError on aborted transaction", function() {
        var tx = db.transaction("store");
        var store = tx.objectStore("store");
        tx.abort();
        assert.throws(function() {
            store.getAllKeys();
        }, /TransactionInactiveError/);
    });
    it("throws DataError when using invalid key", function() {
        assert.throws(function() {
            db.transaction("store")
                .objectStore("store")
                .getAllKeys(NaN);
        }, /DataError/);
    });
});
