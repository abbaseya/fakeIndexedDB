"use strict";
/* tslint:disable: max-classes-per-file max-line-length */
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
Object.defineProperty(exports, "__esModule", { value: true });
var messages = {
    AbortError:
        "A request was aborted, for example through a call to IDBTransaction.abort.",
    ConstraintError:
        "A mutation operation in the transaction failed because a constraint was not satisfied. For example, an object such as an object store or index already exists and a request attempted to create a new one.",
    DataCloneError:
        "The data being stored could not be cloned by the internal structured cloning algorithm.",
    DataError: "Data provided to an operation does not meet requirements.",
    InvalidAccessError:
        "An invalid operation was performed on an object. For example transaction creation attempt was made, but an empty scope was provided.",
    InvalidStateError:
        "An operation was called on an object on which it is not allowed or at a time when it is not allowed. Also occurs if a request is made on a source object that has been deleted or removed. Use TransactionInactiveError or ReadOnlyError when possible, as they are more specific variations of InvalidStateError.",
    NotFoundError:
        "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.",
    ReadOnlyError:
        'The mutating operation was attempted in a "readonly" transaction.',
    TransactionInactiveError:
        "A request was placed against a transaction which is currently not active, or which is finished.",
    VersionError:
        "An attempt was made to open a database using a lower version than the existing version.",
};
var AbortError = /** @class */ (function(_super) {
    __extends(AbortError, _super);
    function AbortError(message) {
        if (message === void 0) {
            message = messages.AbortError;
        }
        var _this = _super.call(this) || this;
        _this.name = "AbortError";
        _this.message = message;
        return _this;
    }
    return AbortError;
})(Error);
exports.AbortError = AbortError;
var ConstraintError = /** @class */ (function(_super) {
    __extends(ConstraintError, _super);
    function ConstraintError(message) {
        if (message === void 0) {
            message = messages.ConstraintError;
        }
        var _this = _super.call(this) || this;
        _this.name = "ConstraintError";
        _this.message = message;
        return _this;
    }
    return ConstraintError;
})(Error);
exports.ConstraintError = ConstraintError;
var DataCloneError = /** @class */ (function(_super) {
    __extends(DataCloneError, _super);
    function DataCloneError(message) {
        if (message === void 0) {
            message = messages.DataCloneError;
        }
        var _this = _super.call(this) || this;
        _this.name = "DataCloneError";
        _this.message = message;
        return _this;
    }
    return DataCloneError;
})(Error);
exports.DataCloneError = DataCloneError;
var DataError = /** @class */ (function(_super) {
    __extends(DataError, _super);
    function DataError(message) {
        if (message === void 0) {
            message = messages.DataError;
        }
        var _this = _super.call(this) || this;
        _this.name = "DataError";
        _this.message = message;
        return _this;
    }
    return DataError;
})(Error);
exports.DataError = DataError;
var InvalidAccessError = /** @class */ (function(_super) {
    __extends(InvalidAccessError, _super);
    function InvalidAccessError(message) {
        if (message === void 0) {
            message = messages.InvalidAccessError;
        }
        var _this = _super.call(this) || this;
        _this.name = "InvalidAccessError";
        _this.message = message;
        return _this;
    }
    return InvalidAccessError;
})(Error);
exports.InvalidAccessError = InvalidAccessError;
var InvalidStateError = /** @class */ (function(_super) {
    __extends(InvalidStateError, _super);
    function InvalidStateError(message) {
        if (message === void 0) {
            message = messages.InvalidStateError;
        }
        var _this = _super.call(this) || this;
        _this.name = "InvalidStateError";
        _this.message = message;
        return _this;
    }
    return InvalidStateError;
})(Error);
exports.InvalidStateError = InvalidStateError;
var NotFoundError = /** @class */ (function(_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message) {
        if (message === void 0) {
            message = messages.NotFoundError;
        }
        var _this = _super.call(this) || this;
        _this.name = "NotFoundError";
        _this.message = message;
        return _this;
    }
    return NotFoundError;
})(Error);
exports.NotFoundError = NotFoundError;
var ReadOnlyError = /** @class */ (function(_super) {
    __extends(ReadOnlyError, _super);
    function ReadOnlyError(message) {
        if (message === void 0) {
            message = messages.ReadOnlyError;
        }
        var _this = _super.call(this) || this;
        _this.name = "ReadOnlyError";
        _this.message = message;
        return _this;
    }
    return ReadOnlyError;
})(Error);
exports.ReadOnlyError = ReadOnlyError;
var TransactionInactiveError = /** @class */ (function(_super) {
    __extends(TransactionInactiveError, _super);
    function TransactionInactiveError(message) {
        if (message === void 0) {
            message = messages.TransactionInactiveError;
        }
        var _this = _super.call(this) || this;
        _this.name = "TransactionInactiveError";
        _this.message = message;
        return _this;
    }
    return TransactionInactiveError;
})(Error);
exports.TransactionInactiveError = TransactionInactiveError;
var VersionError = /** @class */ (function(_super) {
    __extends(VersionError, _super);
    function VersionError(message) {
        if (message === void 0) {
            message = messages.VersionError;
        }
        var _this = _super.call(this) || this;
        _this.name = "VersionError";
        _this.message = message;
        return _this;
    }
    return VersionError;
})(Error);
exports.VersionError = VersionError;
