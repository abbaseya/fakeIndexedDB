"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Event = /** @class */ (function() {
    function Event(type, eventInitDict) {
        if (eventInitDict === void 0) {
            eventInitDict = {};
        }
        this.eventPath = [];
        this.NONE = 0;
        this.CAPTURING_PHASE = 1;
        this.AT_TARGET = 2;
        this.BUBBLING_PHASE = 3;
        // Flags
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
        this.canceled = false;
        this.initialized = true;
        this.dispatched = false;
        this.target = null;
        this.currentTarget = null;
        this.eventPhase = 0;
        this.defaultPrevented = false;
        this.isTrusted = false;
        this.timeStamp = Date.now();
        this.type = type;
        this.bubbles =
            eventInitDict.bubbles !== undefined ? eventInitDict.bubbles : false;
        this.cancelable =
            eventInitDict.cancelable !== undefined
                ? eventInitDict.cancelable
                : false;
    }
    Event.prototype.preventDefault = function() {
        if (this.cancelable) {
            this.canceled = true;
        }
    };
    Event.prototype.stopPropagation = function() {
        this.propagationStopped = true;
    };
    Event.prototype.stopImmediatePropagation = function() {
        this.propagationStopped = true;
        this.immediatePropagationStopped = true;
    };
    return Event;
})();
exports.default = Event;
