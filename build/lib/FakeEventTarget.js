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
var errors_1 = require("./errors");
var stopped = function(event, listener) {
    return (
        event.immediatePropagationStopped ||
        (event.eventPhase === event.CAPTURING_PHASE &&
            listener.capture === false) ||
        (event.eventPhase === event.BUBBLING_PHASE && listener.capture === true)
    );
};
// http://www.w3.org/TR/dom/#concept-event-listener-invoke
var invokeEventListeners = function(event, obj) {
    var e_1, _a;
    event.currentTarget = obj;
    try {
        // The callback might cause obj.listeners to mutate as we traverse it.
        // Take a copy of the array so that nothing sneaks in and we don't lose
        // our place.
        for (
            var _b = __values(obj.listeners.slice()), _c = _b.next();
            !_c.done;
            _c = _b.next()
        ) {
            var listener = _c.value;
            if (event.type !== listener.type || stopped(event, listener)) {
                continue;
            }
            // @ts-ignore
            listener.callback.call(event.currentTarget, event);
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
    var typeToProp = {
        abort: "onabort",
        blocked: "onblocked",
        complete: "oncomplete",
        error: "onerror",
        success: "onsuccess",
        upgradeneeded: "onupgradeneeded",
        versionchange: "onversionchange",
    };
    var prop = typeToProp[event.type];
    if (prop === undefined) {
        throw new Error('Unknown event type: "' + event.type + '"');
    }
    var callback = event.currentTarget[prop];
    if (callback) {
        var listener = {
            callback: callback,
            capture: false,
            type: event.type,
        };
        if (!stopped(event, listener)) {
            // @ts-ignore
            listener.callback.call(event.currentTarget, event);
        }
    }
};
var FakeEventTarget = /** @class */ (function() {
    function FakeEventTarget() {
        this.listeners = [];
    }
    FakeEventTarget.prototype.addEventListener = function(
        type,
        callback,
        capture,
    ) {
        if (capture === void 0) {
            capture = false;
        }
        this.listeners.push({
            callback: callback,
            capture: capture,
            type: type,
        });
    };
    FakeEventTarget.prototype.removeEventListener = function(
        type,
        callback,
        capture,
    ) {
        if (capture === void 0) {
            capture = false;
        }
        var i = this.listeners.findIndex(function(listener) {
            return (
                listener.type === type &&
                listener.callback === callback &&
                listener.capture === capture
            );
        });
        this.listeners.splice(i, 1);
    };
    // http://www.w3.org/TR/dom/#dispatching-events
    FakeEventTarget.prototype.dispatchEvent = function(event) {
        var e_2, _a, e_3, _b;
        if (event.dispatched || !event.initialized) {
            throw new errors_1.InvalidStateError(
                "The object is in an invalid state.",
            );
        }
        event.isTrusted = false;
        event.dispatched = true;
        event.target = this;
        // NOT SURE WHEN THIS SHOULD BE SET        event.eventPath = [];
        event.eventPhase = event.CAPTURING_PHASE;
        try {
            for (
                var _c = __values(event.eventPath), _d = _c.next();
                !_d.done;
                _d = _c.next()
            ) {
                var obj = _d.value;
                if (!event.propagationStopped) {
                    invokeEventListeners(event, obj);
                }
            }
        } catch (e_2_1) {
            e_2 = { error: e_2_1 };
        } finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            } finally {
                if (e_2) throw e_2.error;
            }
        }
        event.eventPhase = event.AT_TARGET;
        if (!event.propagationStopped) {
            invokeEventListeners(event, event.target);
        }
        if (event.bubbles) {
            event.eventPath.reverse();
            event.eventPhase = event.BUBBLING_PHASE;
            try {
                for (
                    var _e = __values(event.eventPath), _f = _e.next();
                    !_f.done;
                    _f = _e.next()
                ) {
                    var obj = _f.value;
                    if (!event.propagationStopped) {
                        invokeEventListeners(event, obj);
                    }
                }
            } catch (e_3_1) {
                e_3 = { error: e_3_1 };
            } finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                } finally {
                    if (e_3) throw e_3.error;
                }
            }
        }
        event.dispatched = false;
        event.eventPhase = event.NONE;
        event.currentTarget = null;
        if (event.canceled) {
            return false;
        }
        return true;
    };
    return FakeEventTarget;
})();
exports.default = FakeEventTarget;
