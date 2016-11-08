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
const
    Picker = require('cms/client/js/manager/picker.ui.js'),
    Template = require('cms/client/js/manager/template'),
    treeParser = require('cms/shared/treeparser'),
    lackey = require('core/client/js');

/**
 * @class
 */
class BlocksUI extends Picker {

    get template() {

        return 'cms/cms/blocks-picker';
    }

    defaultExpose(context) {
        return Template
            .readTemplate(context.template)
            .then(template => template.expose || []);

    }


    get uri() {

    }

    selected() {

    }

    buildUI() {
        let self = this;
        return this
            .defaultExpose(this.options.context)
            .then(expose => {
                this.options.expose = expose;
                return super.buildUI();
            })
            .then(element => {
                lackey.bind('[data-lky-cog]', 'click', self.inspect.bind(self), element);
                lackey.bind('[data-lky-bin]', 'click', self.removeBlock.bind(self), element);
                lackey.bind('[data-lky-add-block]', 'click', self.addBlock.bind(self), element);
                return element;
            });

    }

    inspect(event, hook) {

        let
            path = hook.getAttribute('data-lky-path'),
            templatePath = hook.getAttribute('data-lky-template'),
            structureController,
            data,
            self = this;


        return Template
            .readTemplate(templatePath)
            .then(template => {

            debugger;

                data = treeParser.get(self.options.context, path);
                if (!data) {
                    data = {};
                    treeParser.set(self.options.context, path, data);
                }

                return self.options.stack.inspectSettings(data);

            });

    }

    addBlock(event, hook) {

        this.collapse();

        let
            idx = hook.getAttribute('data-lky-add-block'),
            self = this,
            path = hook.getAttribute('data-lky-path');

        return this.options.stack
            .pickBlock()
            .then(rt => {
                if (rt !== null) {
                    treeParser.insertAfter(self.options.context, path + '.' + idx, {
                        type: 'Block',
                        template: rt,
                        layout: {},
                        props: {}
                    });
                    self.changed();
                    return self.readraw();
                }

            });
    }

    changed() {
        this.options.stack.manager.repository.notify();
        this.options.stack.manager.preview();
    }

    removeBlock(event, hook) {

        let
            path = hook.getAttribute('data-lky-path'),
            self = this;

        treeParser.remove(context, path);
        self.changed();
        return self.readraw();
    }

    query() {
        return Promise.resolve();
    }
}

module.exports = BlocksUI;
