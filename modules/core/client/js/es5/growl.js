/* jslint node:true, browser: true */
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

function Growl(message, status) {
    var self = this;

    self.message = message || '';
    self.status = status || 'info';

    self.isShown = false;

    self.element = self.createElement();
}

Growl.prototype.createElement = function () {
    var self = this,
        element = document.createElement('figure');

    element.setAttribute('data-lky-growl', self.status);
    element.textContent = self.message;

    return element;
};

Growl.prototype.show = function () {
    var self = this;

    if (self.isShown) { return; }
    self.isShown = true;

    top.document.body.appendChild(self.element);

    setTimeout(function () {
        self.element.setAttribute('data-visible', '');
    }, 1);
};

Growl.prototype.hide = function () {
    var self = this;

    if (!self.isShown) { return; }
    self.isShown = false;

    self.element.removeAttribute('data-visible');

    setTimeout(function () {
        self.element.parentNode.removeChild(self.element);
    }, hideLength);
};


var growlTimeout = null;
var currentGrowl = null;
function showGrowl(message, status) {
    var showDelay = 0;

    if (growlTimeout) {
        clearTimeout(growlTimeout);
        growlTimeout = null;

        currentGrowl.hide();
        currentGrowl = null;

        showDelay = hideLength;
    }

    currentGrowl = new Growl(message, status);

    growlTimeout = setTimeout(function () {
        currentGrowl.show();

        growlTimeout = setTimeout(function () {
            currentGrowl.hide();

            growlTimeout = null;
            currentGrowl = null;
        }, showTime);
    }, showDelay);
}


module.exports = function (config) {
    showGrowl(
        config.message || config || '',
        config.status
    );
};
