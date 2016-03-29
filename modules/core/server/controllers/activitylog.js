/* jslint node:true, esnext:true */
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

let Controller = {
    captureRequest: (req, res, next) => {

        try {

            // hack. Saving a reference to the end function to
            // use later on our fake end method we attached
            // to the res object
            var rEnd = res.end,
                tInit = +new Date();

            if (req.method === 'GET') {
                return next();
            }

            if (!req.user) {
                return next();
            }

            res.end = function (chunk, encoding) {

                let sent = false;

                try {

                    var tEnd = +new Date();

                    // Do the work expected
                    res.end = rEnd;
                    res.end(chunk, encoding);
                    sent = true;

                    return require('../models/activity-log') // dead lock
                        .then((ActivitySteam) => {
                            ActivitySteam.log({
                                userId: req.user ? req.user.id : null,
                                method: req.method,
                                url: req.originalUrl,
                                headers: req.headers,
                                body: JSON.stringify(req.body),
                                response: {
                                    status: res.statusCode,
                                    body: (chunk && chunk.toString('utf8')) || '??',
                                    duration: tEnd - tInit
                                }
                            }, (err) => {
                                /* istanbul ignore next */
                                console.error(err); // todo sth with this
                            });
                        }, (err) => {
                            /* istanbul ignore next */
                            console.error(err); // todo sth with this
                        });

                } catch (e) {
                    console.error(e); // todo pass to logger
                    if (!sent) {
                        res.end(chunk, encoding);
                    }
                }
            };

            next();

        } catch (e) {
            /* istanbul ignore next */
            console.error(e);
        }
    },

    capture: (app) => {
        app.decorateMiddleware([Controller.captureRequest], 'Core Module Activity Log');
    }
};

module.exports = Promise.resolve(Controller);
