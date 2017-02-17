/* jslint node:true, browser: true, esnext: true */
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

var hideLength = 500,
    showTime = 3000;

function Growl(message, status, type) {
    var self = this;

    self.message = message || '';
    self.status = status || 'info';
    self.type = type;

    self.isShown = false;


    self.element = self.createElement();
}

Growl.prototype.createElement = function () {
    var self = this,
        element = document.createElement('figure'),
        opts = {};

    element.setAttribute('data-lky-growl', self.status);
    element.textContent = self.message;

    if (self.type === 'yesno') {
        opts.container = document.createElement('div');

        opts.yes = document.createElement('button');
        opts.yes.textContent = 'Yes';
        opts.yes.addEventListener('click', function () {
            self.hide();
            self.resolve();
        });
        opts.no = document.createElement('button');
        opts.no.textContent = 'No';
        opts.no.addEventListener('click', function () {
            self.hide();
        });

        opts.container.appendChild(opts.no);
        opts.container.appendChild(opts.yes);
        element.appendChild(opts.container);
    } else if (self.type === 'input') {
        opts.container = document.createElement('div');
        opts.input = document.createElement('input');
        opts.yes = document.createElement('button');
        opts.yes.textContent = 'Ok';
        opts.yes.addEventListener('click', function () {
            self.hide();
            self.resolve(element.querySelector('input').value);
        });
        opts.no = document.createElement('button');
        opts.no.textContent = 'Cancel';
        opts.no.addEventListener('click', function () {
            self.hide();
        });

        opts.container.appendChild(opts.input);
        opts.container.appendChild(opts.no);
        opts.container.appendChild(opts.yes);
        element.appendChild(opts.container);
    }

    top.document.body.appendChild(element);

    return element;
};

Growl.prototype.show = function () {
    var self = this;

    if (self.isShown) { return; }
    self.isShown = true;

    setTimeout(function () {
        self.element.setAttribute('data-visible', '');
    }, 1);
};

Growl.prototype.hide = function () {
    var self = this;

    self.element.removeAttribute('data-visible');

    setTimeout(function () {
        if (self.element.parentNode) {
            self.element.parentNode.removeChild(self.element);
        }
        if (self.type === 'info') {
            self.resolve();
        }
    }, hideLength);
};


var growlTimeout = null;
var currentGrowl = null;
function showGrowl(message, status, type) {
    var showDelay = 0;

    if (growlTimeout) {
        clearTimeout(growlTimeout);
        growlTimeout = null;

        currentGrowl.hide();
        currentGrowl = null;

        showDelay = hideLength;
    }

    currentGrowl = new Growl(message, status, type);
    return new Promise(function (resolve, reject) {
        currentGrowl.resolve = resolve;
        currentGrowl.reject = reject;

        growlTimeout = setTimeout(function () {
            currentGrowl.show();

            if (type === 'info'){
                growlTimeout = setTimeout(function () {
                    currentGrowl.hide();

                    growlTimeout = null;
                    currentGrowl = null;
                }, showTime);
            }
        }, showDelay);
    });
}


module.exports = function (config) {
    return showGrowl(
        config.message || config || '',
        config.status,
        config.type || 'info'
    );
};
