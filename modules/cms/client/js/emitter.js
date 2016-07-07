/* jslint esnext:true, node:true */
'use strict';
/**
    The MIT License (MIT)

    Copyright (c) 2016 Łukasz Marek Sielski

    This file is copied from http://github.com/sielay/skaryna

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

/**
 * @namespace skaryna
 *
 * @class EventConfig
 * @property {function} fn listener
 * @property {object} context
 * @property {array} args arguments to be passed
 * @property {boolean} once if should be fired only once
 */

/**
 * @class Event
 */
class Event {
    /**
     * Contructor
     * @constructs Event
     * @param {string} name
     * @param {mixed} data
     * @param {object} source
     * @param {Event} parent
     */
    constructor(name, data, source, parent) {
        Object.defineProperties(this, {
            /**
             * @property {string}
             * @name Event#name
             */
            name: {
                value: name,
                writable: false
            },
            /**
             * @property {mixed}
             * @name Event#data
             */
            data: {
                value: data,
                writable: false
            },
            /**
             * @property {object}
             * @name Event#source
             */
            source: {
                value: source,
                writable: false
            },
            /**
             * @property {Event|null}
             * @name Event#parent
             */
            parent: {
                value: parent,
                writable: false
            }
        });
    }

    toJSON() {
        return {
            name: this.name,
            data: this.data,
            source: this.source,
            parent: this.parent
        };
    }

    toString() {
        return 'Event: ' + JSON.stringify(this.toJSON());
    }
}

/**
 * [[Description]]
 * @param {Event} cofnig
 * @param {EventConfig} thisObject
 */
function execute(event, config) {
    let {
        fn, context, args
    } = config,
    params = [event].concat(args);

    fn.apply(context || null, params);
}

/*
 * @class Emitter
 */
class Emitter {

    /**
     * Adds listener for an event
     * @param {string} eventName
     * @param {function} handler
     * @param {object} context
     * @param {array} args
     * @param {boolean} once
     */
    on(eventName, handler, context, args, once) {
        this.__listeners = this.__listeners || {};
        this.__listeners[eventName] = this.__listeners[eventName] || [];
        this.__listeners[eventName].push({
            fn: handler,
            context: context,
            args: args,
            once: !!once
        });
    }

    /**
     * Adds listener for an event that should be called once
     * @param {string} eventName
     * @param {function} handler
     * @param {object} context
     * @param {array} args
     */
    once(eventName, handler, context, args) {
        this.on(eventName, handler, context, args, true);
    }

    /**
     * Adds listener for an event
     * @param {string} eventName
     * @param {function} handler
     * @param {object} context
     * @param {array} args
     * @param {boolean} once
     */
    off(eventName, handler, context, args, once) {
        if (!this.__listeners || !this.__listeners[eventName]) {
            return;
        }
        this
            .getListeners(eventName, handler, context, args, once)
            .forEach((config) => {
                this.__listeners[eventName].splice(this.__listeners[eventName].indexOf(config), 1);
            });

    }

    /**
     * Emits an event
     * @param {string} eventName
     * @param {mixed} data
     * @param {Event|null} parent
     */
    emit(eventName, data, parent) {
        if (!this.__listeners || !this.__listeners[eventName]) {
            return;
        }

        let self = this,
            event = new Event(eventName, data, this, parent);

        this
            .getListeners(eventName)
            .forEach((config) => {
                if (config.once === true) {
                    self.off(eventName, config.fn, config.context, config.args, config.once);
                }
                execute(event, config);
            });
    }

    /**
     * Bubbles event to other emitter
     * @param {string} eventName
     * @param {object} toEmitter
     */
    bubbleEvent(eventName, toEmitter) {
        this.on(eventName, (event) => {
            toEmitter.emit(eventName, event.data, event);
        });
    }

    /**
     * Gets all listeners that match criteria
     * @param   {string} eventName required
     * @param   {function} handler   if defined will be used for match
     * @param   {object} context   if defined will be used for match
     * @param   {array} args      if defined will be used for match
     * @returns {array<EventConfig>|null}
     */
    getListeners(eventName, handler, context, args) {
        if (!this.__listeners || !this.__listeners[eventName]) {
            return null;
        }

        return this.__listeners[eventName]
            .map((config) => {
                if (handler !== undefined && config.fn !== handler) {
                    return false;
                }
                if (context !== undefined && config.context !== context) {
                    return false;
                }
                if (args !== undefined && config.args !== args) {
                    return false;
                }
                return config;
            })
            .filter((result) => !!result);
    }

}

module.exports.Emitter = Emitter;
module.exports.Event = Event;
