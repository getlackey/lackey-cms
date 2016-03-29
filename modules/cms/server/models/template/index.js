/* jslint esnext:true, node:true */
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
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const SUtils = require(LACKEY_PATH).utils,
    objection = require('objection'),
    SCli = require(LACKEY_PATH).cli,
    Model = objection.Model;


module.exports = SUtils.deps(
    SUtils.cmsMod('core').model('objection'),
    require('./knex')
).promised((ObjectionWrapper) => {

    class TemplateModel extends Model {
        static get tableName() {
            return 'template';
        }
    }

    /**
     * @class
     */
    class Template extends ObjectionWrapper {

        static get model() {
            return TemplateModel;
        }

        get path() {
            return this._doc.path;
        }

        get type() {
            return this._doc.type;
        }

        toJSON() {
            return {
                id: this.id,
                name: this._doc.name,
                path: this._doc.path,
                type: this._doc.type,
                javascripts: this._doc.javascripts,
                stylesheets: this._doc.stylesheets
            };
        }

        _preSave() {
            if (this._doc) {
                if (this._doc.javascripts) {
                    if (!Array.isArray(this._doc.javascripts)) {
                        this._doc.javascripts = [this._doc.javascripts];
                    }
                    this._doc.javascripts = JSON.stringify(this._doc.javascripts);
                }
                if (this._doc.stylesheets) {
                    if (!Array.isArray(this._doc.stylesheets)) {
                        this._doc.stylesheets = [this._doc.stylesheets];
                    }
                    this._doc.stylesheets = JSON.stringify(this._doc.stylesheets);
                }
                if(!this._doc.type) {
                    this._doc.type = 'template';
                }
            }
            return Promise.resolve(this);
        }

        static getOfType(type) {
            return SCli.sql(TemplateModel
                    .query()
                    .where('type', type))
                .then((results) => {
                    return results.map((result) => new Template(result));
                });
        }

        static getByPath(path) {
            return this.findOneBy('path', path);
        }
    }

    require('./generator');

    return Template;
});
