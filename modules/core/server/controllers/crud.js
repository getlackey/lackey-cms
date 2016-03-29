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

class CRUDController {

    static get model() {
        throw new Error('You have to override this method');
    }

    static get field() {
        throw new Error('You have to override this method');
    }

    static get tableConfig() {
        throw new Error('You have to override this method');
    }

    // ================================================ CRUD
    // Create
    static create(req, res) {
        this.model.create(req.body).then((instance) => {
            res.api(instance);
        }, function (error) {
            console.error(error);
            res.error(req, error);
        });
    }

    // Read
    static read(req, res) {
        res.api(req[this.field]);
    }

    // Update
    static update(req, res) {
        req[this.field].update(req.body).then((instance) => {
            res.api(instance);

        }, (error) => {
            console.error(error);
            req.error(req, error);
        });
    }

    // Delete

    // List
    static list(req, res) {
            let restParams = req.getRESTQuery(true);

            this.model.table(restParams.query, this.tableConfig, restParams.options).then((data) => {
                res.api(data);
            }, (error) => {
                res.error(req, error);
            });
        }
    // ById
    static byId(req, res, next, id) {
            let self = this;
            this.model.findById(id)
                .then((content) => {
                    req[self.field] = content;
                    next();
                }, (error) => {
                    req.error(req, error);
                });
        }
    // ================================================ /CRUD

    static table(req, res) {

        let restParams = req.getRESTQuery(true);

        this.model.table(restParams.query, this.tableConfig).then((data) => {
            res.send({
                template: 'cms/cms/tableview',
                javascripts: [
                    'js/cms/cms/table.js'
                ],
                data: {
                    table: data
                }
            });
        }, (error) => {
            res.error(req, error);
        });

    }

    static method(methodName, param) {
        let self = this;
        if(!param) {
            return (req, res, next) => self[methodName](req, res, next);
        }
        return (req, res, next, id) => self[methodName](req, res, next, id);
    }

}

module.exports = Promise.resolve(CRUDController);
