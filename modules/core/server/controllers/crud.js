/* jslint esnext:true, node:true */
/* globals LACKEY_PATH */
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

const CRUDInjectionController = require('./crud.injection');

class CRUDController extends CRUDInjectionController {

    static get model() {
        throw new Error('You have to override this method');
    }

    // ================================================ CRUD
    // Create
    static create(req, res) {
        return super.create(this.model, req, res);
    }

    static read(req, res) {
       return super.read(this.model, req, res);
    }

    // Update
    static update(req, res) {
        return super.update(this.model, req, res);
    }

    // Delete
    static delete(req, res) {
        return super.delete(this.model, req, res);
    }

    // List
    static list(req, res) {
        return super.list(this.model, req, res);
    }

    // ById
    static byId(req, res, next, id) {
        return super.byId(this.model, req, res, next, id);
    }

    static table(req, res) {
        return super.table(this.model, req, res);
    }

}

module.exports = Promise.resolve(CRUDController);
