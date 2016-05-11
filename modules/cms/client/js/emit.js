/* eslint no-cond-assign:0, no-new:0 */
/* jslint browser:true, node:true, esnext:true */
'use strict';
/*
    Copyright 2016 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/**
 * Add event listener
 * @param {String} eventName
 * @param {Function} listener
 */
function on(eventName, listener) {
    this.__listeners = this.__listeners || {};
    this.__listeners[eventName] = this.__listeners[eventName] || [];
    this.__listeners[eventName].push(listener);
}

/**
 * Remove listener or all listeners
 * @param {String} eventName
 * @param {Function|null} listener
 */
function off(eventName, listener) {
    if (!this.__listeners || !this.__listeners[eventName]) {
        return;
    }
    if (!listener) {
        delete this.__listeners[eventName];
    }
    var index = this.__listeners[eventName].indexOf(listener);
    if (index !== -1) {
        this.__listeners[eventName].splice(index, 1);
    }
}

/**
 * Emits event
 * @param {[[Type]]} eventName [[Description]]
 * @param {[[Type]]} data      [[Description]]
 */
function emit(eventName, data) {
    if (!this.__listeners || !this.__listeners[eventName]) {
        return;
    }
    var self = this;
    this.__listeners[eventName].forEach(function (listener) {
        listener({
            name: eventName,
            data: data,
            source: self
        });
    });
}

/**
 * Bubbles up event
 * @param {EventEmitter} emitter
 * @param {String} eventName
 */
function bubble(emitter, eventName, asEvent) {
    this.on(eventName, (event) => {
        emitter.emit(asEvent || eventName, event.data);
    });
}

module.exports = function (prot) {
    prot.on = on;
    prot.off = off;
    prot.emit = emit;
    prot.bubble = bubble;
};
