/* jslint node:true, esnext:true */
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
const gate = require('../lib/gate');
/**
 * @class
 */
class DownloadController {

    /**
     * Handle download link
     * @param {MediaModel} model
     * @param {Request}   req
     * @param {Resposne} res
     */
    static download(Media, config, req, res) {
        try {
            let json = gate.decipherToken(config.get('salt'), req.downloadToken);
            if (json.id && json.type === 'media') {
                Media
                    .findById(json.id)
                    .then(media => {
                        return media.canSee(req.user ? req.user.id : null)
                            .then((canSee) => {
                                if (!canSee) {
                                    return res.error403(req);
                                }
                                res.api(media);
                            });
                    });
            } else {
                res.error404();
                return;
            }
        } catch (error) {
            console.error(error);
            res.api(error);

        }

    }
}

module.exports = DownloadController;
