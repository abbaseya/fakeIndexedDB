"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scheduling_1 = require("./scheduling");
// http://www.w3.org/TR/2015/REC-IndexedDB-20150108/#dfn-database
var Database = /** @class */ (function() {
    function Database(name, version) {
        this.deletePending = false;
        this.transactions = [];
        this.rawObjectStores = new Map();
        this.connections = [];
        this.name = name;
        this.version = version;
        this.processTransactions = this.processTransactions.bind(this);
    }
    Database.prototype.processTransactions = function() {
        var _this = this;
        scheduling_1.queueTask(function() {
            var anyRunning = _this.transactions.some(function(transaction) {
                return (
                    transaction._started && transaction._state !== "finished"
                );
            });
            if (!anyRunning) {
                var next = _this.transactions.find(function(transaction) {
                    return (
                        !transaction._started &&
                        transaction._state !== "finished"
                    );
                });
                if (next) {
                    next.addEventListener(
                        "complete",
                        _this.processTransactions,
                    );
                    next.addEventListener("abort", _this.processTransactions);
                    next._start();
                }
            }
        });
    };
    return Database;
})();
exports.default = Database;
