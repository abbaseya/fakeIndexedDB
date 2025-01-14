"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cmp_1 = require("./cmp");
/**
 * Classic binary search implementation. Returns the index where the key
 * should be inserted, assuming the records list is ordered.
 */
function binarySearch(records, key) {
    var low = 0;
    var high = records.length;
    var mid;
    while (low < high) {
        // tslint:disable-next-line:no-bitwise
        mid = (low + high) >>> 1; // like Math.floor((low + high) / 2) but fast
        if (cmp_1.default(records[mid].key, key) < 0) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}
/**
 * Equivalent to `records.findIndex(record => cmp(record.key, key) === 0)`
 */
function getIndexByKey(records, key) {
    var idx = binarySearch(records, key);
    var record = records[idx];
    if (record && cmp_1.default(record.key, key) === 0) {
        return idx;
    }
    return -1;
}
exports.getIndexByKey = getIndexByKey;
/**
 * Equivalent to `records.find(record => cmp(record.key, key) === 0)`
 */
function getByKey(records, key) {
    var idx = getIndexByKey(records, key);
    return records[idx];
}
exports.getByKey = getByKey;
/**
 * Equivalent to `records.findIndex(record => key.includes(record.key))`
 */
function getIndexByKeyRange(records, keyRange) {
    var lowerIdx =
        typeof keyRange.lower === "undefined"
            ? 0
            : binarySearch(records, keyRange.lower);
    var upperIdx =
        typeof keyRange.upper === "undefined"
            ? records.length - 1
            : binarySearch(records, keyRange.upper);
    for (var i = lowerIdx; i <= upperIdx; i++) {
        var record = records[i];
        if (record && keyRange.includes(record.key)) {
            return i;
        }
    }
    return -1;
}
exports.getIndexByKeyRange = getIndexByKeyRange;
/**
 * Equivalent to `records.find(record => key.includes(record.key))`
 */
function getByKeyRange(records, keyRange) {
    var idx = getIndexByKeyRange(records, keyRange);
    return records[idx];
}
exports.getByKeyRange = getByKeyRange;
/**
 * Equivalent to `records.findIndex(record => cmp(record.key, key) >= 0)`
 */
function getIndexByKeyGTE(records, key) {
    var idx = binarySearch(records, key);
    var record = records[idx];
    if (record && cmp_1.default(record.key, key) >= 0) {
        return idx;
    }
    return -1;
}
exports.getIndexByKeyGTE = getIndexByKeyGTE;
