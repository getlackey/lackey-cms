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

const
    SUtils = require(LACKEY_PATH).utils,
    CRUD = SUtils.cmsMod('core').controller('crud.injection', true);

/**
 * @class
 * @name UserController
 * Users CMS Controller
 *
 */
class PreviewController extends CRUD {

    /**
     * @override
     * @see lackey-cms/modules/core/server/controllers/CrudInjectionController#field
     */
    static get field() {
        return this._overriden('field', 'previews');
    }

    static getByContentId(Model, req, res) {
        let contentId = req.params.contentId;
        Model.findOneBy('contentId', contentId)
            .then((preview) => {
                res.api(preview);
            });
    }

}

module.exports = PreviewController;
