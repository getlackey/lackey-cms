/* eslint no-cond-assign:0, no-new:0 no-param-reassign:0 */
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
const
    lackey = require('core/client/js'),
    api = require('core/client/js/api'),
    xhr = require('core/client/js/xhr'),
    emit = require('cms/client/js/emit'),
    treeParser = require('cms/shared/treeparser'),
    Repository = require('cms/client/js/manager/repository'),
    ChangeUI = require('cms/client/js/manager/change.ui.js'),
    StructureUI = require('cms/client/js/manager/structure.ui.js'),
    prefix = require('cms/client/js/iframe.resolve')(xhr.base, '', true),
    Stack = require('cms/client/js/manager/stack'),
    userDrop = require('cms/client/js/manager/user.dropdown.js');

let locale = 'en',
    defaultLocale = 'en';

lackey
    .select('html')
    .forEach((elem) => {
        locale = elem.getAttribute('lang');
        defaultLocale = elem.getAttribute('data-default-locale');
        if (locale === defaultLocale) {
            locale = '*';
        }
    });


/**
 * @module lackey-cms/modules/cms/client/manager
 */


/**
 * @class
 */
function Manager() {

    let self = this,
        overlay = lackey
        .hook('settings.overlay');

    this.locale = locale;

    Object.defineProperty(this, 'current', {
        /**
         * @property {Promise.<Object>}
         * @name Manager#current
         */
        get: function () {
            if (!this._current) {
                this._loadCurrent();
            }
            return this
                ._current
                .then(id => self.repository.get('content', id)).catch((error) => {
                    console.error(error);
                });
        },
        enumerable: false
    });

    this.repository = new Repository(this);
    this.repository.on('changed', this.onChanged.bind(this));
    this.repository.on('apply', () => {
        self.structureChanges = false;
    });
    this.repository.bubble(this, 'reset');

    this.stack = new Stack(this.repository, this);
    this.stack.on('transition', this.onStackChange.bind(this));
    this.structureChanges = false;


    overlay.addEventListener('mousewheel', (e) => {
        if (e.srcElement === overlay) {
            let content = lackey.hook('iframe', top.document.body).contentDocument.body;
            content.scrollTop = (e.wheelDelta * -1) + content.scrollTop;
        }
    }, true);
    overlay.addEventListener('click', () => {
        this.stack.clear();
    }, true);

    this.setupUI();
}

emit(Manager.prototype);

/**
 * Forces loading currently viewed document data
 * @private
 */
Manager.prototype._loadCurrent = function () {

    let
        loc = top.location.pathname,
        self = this;

    if (prefix && prefix.length) {
        loc = loc.replace(new RegExp('^/' + prefix), '');
    }

    loc = loc.replace(/^\/admin/, '');

    if (loc === '') {
        loc = '/';
    }


    this._current = api
        .read('/cms/content?route=' + loc)
        .then(data => {
            if (data.$locale) {
                locale = self.locale = data.$locale;
            }
            if (loc !== data.data[0].route) {
                top.history.pushState('', top.document.title, '/admin' + data.data[0].route);
            }
            return data.data[0].id;
        })
        .catch(error => console.error(error));
};

Manager.prototype.setAction = function (options) {

    let li = document.createElement('li'),
        a = document.createElement('a'),
        i = document.createElement('i');
    i.className = options.class;
    a.appendChild(i);
    li.appendChild(a);
    this._toolsNode.appendChild(li);
    li.addEventListener('click', options.handler, true);
};

/**
 * Gets content node
 * @param   {Number} contentId [[Description]]
 * @param   {String} path      [[Description]]
 * @param   {String|null} variant   [[Description]]
 * @param   {String|null} schema    [[Description]]
 * @returns {Promise.<Mixed>}} [[Description]]
 */
Manager.prototype.get = function (contentId, path, variant, schema) {

    return this.repository
        .get('content', contentId)
        .then(content => {
            let source = treeParser.get(content.layout, path, variant, null, locale);
            if (!source && schema) {
                source = schema.newDoc();
            }
            return source;
        });
};

/**
 * Sets content node
 * @param   {Number} contentId
 * @param   {String} path
 * @param   {String} variant
 * @param   {Mixed} value
 * @returns {Promise}
 */
Manager.prototype.set = function (contentId, path, variant, value) {
    return this
        .update('content', contentId, function (content) {
            treeParser.set(content.layout, path, value, variant || '*', null, locale !== defaultLocale ? locale : '*');
        });
};

/**
 * Inserts before
 * @param   {Number} contentId
 * @param   {String} path
 * @param   {String} variant
 * @param   {Mixed} value
 * @returns {Promise}
 */
Manager.prototype.insertAfter = function (contentId, path, variant, value) {
    return this
        .update('content', contentId, function (content) {
            treeParser.insertAfter(content.layout, path, value, variant || '*', null, locale !== defaultLocale ? locale : '*');
        });
};


/**
 * Removes
 * @param   {Number} contentId
 * @param   {String} path
 * @param   {String} variant
 * @param   {Mixed} value
 * @returns {Promise}
 */
Manager.prototype.remove = function (contentId, path, variant) {
    return this
        .update('content', contentId, function (content) {
            treeParser.remove(content.layout, path, variant || '*', null, locale !== defaultLocale ? locale : '*');
        });
};

/**
 * Gets content node
 * @param   {Number} contentId [[Description]]
 * @param   {String} path      [[Description]]
 * @param   {String|null} variant   [[Description]]
 * @returns {Promise.<Mixed>}} [[Description]]
 */
Manager.prototype.getMedia = function (contentId) {

    return this
        .repository
        .get('media', contentId)
        .then(content => {
            return content;
        });
};

/**
 * Gets content node
 * @param   {Number} contentId [[Description]]
 * @param   {String} path      [[Description]]
 * @param   {String|null} variant   [[Description]]
 * @returns {Promise.<Mixed>}} [[Description]]
 */
Manager.prototype.setMedia = function (contentId, content) {
    return this
        .repository
        .set('media', contentId, content);
};

/**
 * Opens a dialog to edit a block.
 * @param   {String} path      [[Description]]
 * @param   {String} template  [[Description]]
 */
Manager.prototype.editBlock = function (path, template) {
    this.showTab('blocks', structureUi => structureUi.inspect(path, template));
};

Manager.prototype.preview = function (variant, language) {
    let self = this;
    this
        .current
        .then(def => self.repository.get('content', def.id))
        .then(contents => {
            let data = JSON.stringify({
                    location: (a => {
                        return a === '' ? '/' : a;
                    })(top.location.href.replace(new RegExp('^' + xhr.base + 'admin'), '')),
                    contents: contents
                }),
                form = top.document.createElement('form'),
                input = top.document.createElement('input'),
                inputVariant = top.document.createElement('input'),
                inputLanguage = top.document.createElement('input');
            form.method = 'post';
            form.action = xhr.base + 'cms/preview';
            form.target = '_preview';
            input.type = inputVariant.type = inputLanguage.type = 'hidden';
            input.name = 'preview';
            inputVariant.name = 'variant';
            inputLanguage.name = 'locale';
            input.value = data;
            if (variant !== undefined) {
                self.variant = variant;
            }
            if (self.variant !== undefined) {
                inputVariant.value = self.variant;
                form.appendChild(inputVariant);
            }

            if (language !== undefined) {
                inputLanguage.value = language;
                self.locale = language;
                locale = language;
            } else {
                inputLanguage.value = self.locale;
            }
            form.appendChild(inputLanguage);

            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        });
};

Manager.prototype.showTab = function (tab, callback) {
    lackey.hook('header.settings').setAttribute('disabled', 'disabled');

    let self = this,
        structureController,
        promise;

    callback = callback || function () {};

    if (self.stack.length) {
        promise = self.stack.clear().catch(error => {
            console.error(error);
        });
    } else {
        promise = self
            .current
            .then(current => {
                structureController = new StructureUI({
                    manager: self,
                    type: 'content',
                    id: current.id,
                    context: () => Promise.resolve(self.current),
                    stack: self.stack
                }, self.repository);

                structureController.on('changed', self.onStructureChange.bind(self));

                return self.stack.inspectStructure(structureController, tab);
            });
    }

    promise
        .then(() => {
            lackey.hook('header.settings').removeAttribute('disabled');
            callback(structureController);
        }, error => console.error(error))
        .catch(error => {
            console.error(error);
        });
};

/**
 * Handler for repository changes
 * @param {RepositoryEvent} event
 */
Manager.prototype.onChanged = function () {
    //
};

/**
 * Handler for stack change
 * @param {StackEvent} event
 */
Manager.prototype.onStackChange = function () {};

Manager.prototype.onViewStructure = function (event) {
    this.showTab(event.target.getAttribute('data-lky-tab'));
};

Manager.prototype.onStructureChange = function () {
    this.repository.notify();
    this.preview();
    this.structureChanges = true;
};

Manager.prototype.onPagePropertiesChanged = function (event) {
    return this
        .updateCurrent(content => {
            content.props = event.data;
        })
        .then(this.preview.bind(this));
};


Manager.prototype.update = function (type, id, handler) {
    let self = this;
    return this.repository
        .get(type, id)
        .then(content => {
            handler(content);
            return self.repository.set(type, id, content);
        });
};

Manager.prototype.updateCurrent = function (handler) {
    return this
        .current
        .then(current => this.update('content', current.id, handler));
};

function showShareUrl(shareBox, urlInput, base, preview) {
    shareBox.style.display = 'block';
    urlInput.value = base + '?preview=' + preview.shareString;
    urlInput.select();

    var unbind, hide, mouseEnter, mouseLeave, timeout;

    unbind = function () {
        shareBox.removeEventListener('mouseleave', mouseLeave);
        shareBox.removeEventListener('mouseenter', mouseEnter);
    };

    hide = function () {
        unbind();
        shareBox.style.display = 'none';
    };

    mouseLeave = function () {
        clearTimeout(timeout);
        timeout = setTimeout(hide, 500);
    };

    mouseEnter = function () {
        clearTimeout(timeout);
    };

    clearTimeout(timeout);
    timeout = setTimeout(hide, 3000);

    shareBox.addEventListener('mouseleave', mouseLeave);
    shareBox.addEventListener('mouseenter', mouseEnter);
}

Manager.prototype.setupUI = function () {

    let self = this,
        settingsButton = lackey.hook('header.settings');

    userDrop();

    settingsButton
        .addEventListener('click', this.onViewStructure.bind(this), true);

    lackey
        .hook('header.blocks')
        .addEventListener('click', this.onViewStructure.bind(this), true);

    this._changeUI = new ChangeUI(this.repository);
    lackey
        .select([
            '[data-lky-hook="header.settings"]',
            '[data-lky-hook="header.publish"]'
        ])
        .forEach(element => {
            element.style.display = 'block';
        });

    top.document.body.addEventListener('keydown', ev => {
        if (this.stack.length > 0 && ev.keyCode === 27 && !ev.defaultPrevented) {
            ev.preventDefault();
            ev.stopPropagation();

            this.stack.clear();
        }
    }, true);
    let focusIfNeeded = () => {
        if (top.document.activeElement.nodeName === 'IFRAME') {
            settingsButton.focus();
        }
    };
    this.stack.on('pick', focusIfNeeded);
    this.stack.on('inspect', focusIfNeeded);

    this
        .current
        .then(current => {

            if (current.template && current.template.expose && current.template.expose.length) {
                lackey
                    .select([
                        '[data-lky-hook="header.blocks"]'
                    ])
                    .forEach(element => {
                        element.style.display = 'block';
                    });
            }

            let publishDiv = lackey.hook('header.publish'),
                publishControl = lackey.select('input[type="checkbox"]', publishDiv)[0],
                shareDiv = lackey.hook('header.share');

            publishControl.checked = current.state === 'published';

            publishDiv.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                publishControl.checked = !publishControl.checked;
                self.updateCurrent(cur => {
                    cur.state = publishControl.checked ? 'published' : null;
                });

                if (publishControl.checked) {
                    shareDiv.style.display = 'none';
                } else {
                    shareDiv.style.display = 'block';
                }
            }, true);

            publishControl.addEventListener('click', () => {
                self.updateCurrent(cur => {
                    cur.state = publishControl.checked ? 'published' : null;
                });
            }, true);

            if (current.state === 'published') {
                shareDiv.style.display = 'none';
            } else {
                shareDiv.style.display = 'block';
            }

            shareDiv.addEventListener('click', function () {
                var base = xhr.base.replace(/\/$/, '') + current.route,
                    shareBox = document.querySelector('.shareBox'),
                    urlInput = shareBox.querySelector('input');

                api.read('/cms/preview/' + current.id)
                    .then((preview) => {
                        if (preview.shareString) {
                            showShareUrl(shareBox, urlInput, base, preview);
                        } else {
                            api.create('/cms/preview', {contentId: current.id})
                                .then((prev) => {
                                    showShareUrl(shareBox, urlInput, base, prev);
                                });
                        }
                    });
            }, true);
        });
};


Manager.init = function () {
    if (top.LackeyManager) {
        return top.LackeyManager;
    }
    top.LackeyManager = new Manager();
};

Manager.prototype.diff = function () {
    let self = this;
    lackey
        .select(['[data-lky-component="visual-diff"]'])
        .forEach(hook => {
            hook.innerHTML = self.repository.visualDiff();
        });
};

module.exports = Manager;
