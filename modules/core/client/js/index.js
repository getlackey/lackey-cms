/* jslint node:true, browser:true, esnext:true */
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

var lackey,
    eventHandlers = {};

function select(selector, root) {
    if (!selector) return [];
    if (Array.isArray(selector)) {
        let result = [];
        selector.forEach((singleSelector) => {
            result = result.concat(select(singleSelector, root) || []);
        });
        return result;
    }
    if (selector.match(/^lky:(.+)$/)) {
        let hookName = selector.split(':').slice(1).join(':');
        return lackey.hooks(hookName, root);
    }
    let found = (root || document).querySelectorAll(selector);
    return [].slice.call(found);
}

function getWithAttribute(attribute, value, root) {
    return select('[' + attribute + (value !== undefined ? ('="' + value + '"') : '') + ']', root);
}

function initShow() {
    getWithAttribute('data-lky-show').forEach(function (hook) {
        var targetSelector = hook.getAttribute('data-lky-show');
        hook.addEventListener('click', function (event) {
            event.preventDefault();
            event.cancelBubble = true;
            lackey.show(targetSelector);
        }, true);
    });
}

function initHide() {
    getWithAttribute('data-lky-hide').forEach(function (hook) {
        var targetSelector = hook.getAttribute('data-lky-hide');
        hook.addEventListener('click', function () {
            lackey.hide(targetSelector);
            event.preventDefault();
            event.cancelBubble = true;
        }, true);
    });
}

function hasClass(ele, cls) {
    return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

function addClass(ele, cls) {
    if (!hasClass(ele, cls)) ele.className += ' ' + cls;
}

function removeClass(ele, cls) {
    if (hasClass(ele, cls)) {
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
        ele.className = ele.className.replace(reg, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    }
}

// Create cookie
function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    } else {
        expires = '';
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

// Read cookie
function readCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}

// Erase cookie
function eraseCookie(name) {
    createCookie(name, '', -1);
}

lackey = {
    as: function (fn, context) {
        var ctx = context,
            fcn = fn;
        return function () {
            return fcn.apply(ctx, arguments);
        };
    },
    setCookie: createCookie,
    getCookie: readCookie,
    removeCookie: eraseCookie,
    select: select,
    getWithAttribute: getWithAttribute,
    hooks: function (name, root) {
        if (name && name.nodeType === 1) {
            return [name];
        }
        return getWithAttribute('data-lky-hook', name, root);
    },
    hook: function (name, root) {
        return lackey.hooks(name, root)[0];
    },
    bind: function (selector, event, callback, root) {
        var wrap = function (foundHook) {
            var elem = foundHook,
                proxy = function (proxiedEvent) {
                    return callback(proxiedEvent, elem, function () {
                        elem.removeEventListener(event, proxy, true);
                    });
                };
            elem.addEventListener(event, proxy, true);
        };
        if (selector && selector.nodeType === 1) {
            return wrap(selector);
        }
        return lackey.select(selector, root).forEach(wrap);

    },
    // doesn't work for proxies
    unbind: function (selector, event, callback, root) {
        lackey.select(selector, root).forEach(function (foundHook) {
            foundHook.removeEventListener(event, callback);
        });
    },
    init: function () {
        document.removeEventListener('load', lackey.init);
        initShow();
        initHide();
    },
    form: function (form) {
        var values = {};

        select([
            'input',
            'textarea',
            'select'
        ], form).forEach(function (element) {
            if (element.name && element.name.length) {
                if (element.type === 'checkbox') {
                    values[element.name] = element.checked ? element.value : null;
                } else {
                    values[element.name] = element.value;
                }
            }
        });
        return values;
    },
    each: function (selector, callback, root) {
        select(selector, root).forEach(callback);
    },
    show: function (selector, root) {
        lackey.each(selector, function (target) {
            if (!target.classList) {
                return addClass(target, 'show');
            }
            /* istanbul ignore next : atomus don't support classList */
            target.classList.add('show');
        }, root);
    },
    hide: function (selector, root) {
        lackey.each(selector, function (target) {
            if (!target.classList) {
                return removeClass(target, 'show');

            }
            /* istanbul ignore next : atomus don't support classList */
            target.classList.remove('show');
        }, root);
    },
    addClass: addClass,
    removeClass: removeClass,
    hasClass: hasClass,
    on: function (event, cb) {
        eventHandlers[event] = eventHandlers[event] || [];
        eventHandlers[event].push(cb);
        return lackey;
    },
    off: function (event, cb) {
        if (eventHandlers[event] && eventHandlers[event].indexOf(cb) !== -1) {
            eventHandlers[event].splice(eventHandlers[event].indexOf(cb), 1);
        }
        return lackey;
    },
    emit: function (event, data) {
        if (eventHandlers[event]) {
            eventHandlers[event].forEach(function (cb) {
                setTimeout(function () {
                    cb(data);
                }, 0);
            });
        }
        if(this !== top.Lackey) {
            top.Lackey.emit(event, data);
        }
        return lackey;
    }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    lackey.init();
} else {
    /* istanbul ignore next : atomus don't support before load */
    window.addEventListener('load', lackey.init);
}
window.Lackey = lackey;
module.exports = lackey;
