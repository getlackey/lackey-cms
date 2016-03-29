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
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../lib';
}

const path = require('path'),
    SUtils = require(LACKEY_PATH + '/utils'),
    fs = require('fs');

module.exports = Promise.resolve({

    read: function (req, res, next) {

        let route = req.path.replace(/^\/docs/, '').replace('..', ''),
            isLackey = route.match(/^\/lackey/),
            root = (isLackey ? SUtils.getLackeyPath() : SUtils.getProjectPath()),
            filePath;

        if (route === '') {
            return res.send({
                template: 'cms/docs/directory',
                javascripts: [],
                stylesheets: ['css/cms/docs/base.css'],
                data: {
                    files: [
                        {
                            path: '/docs/lackey/',
                            label: 'Lackey documentation'
                    },
                        {
                            path: '/docs/site',
                            label: 'Website documentation'
                    }
                    ]
                }
            });
        }

        route = route.replace(/^\/(lackey|site)/, '');
        filePath = root + route;

        if (!filePath.match(/\.md$/)) {
            filePath = path.join(filePath, 'README.md');
        }

        function print() {
            res.send({
                template: 'cms/docs/markdown',
                javascripts: [],
                stylesheets: ['css/cms/docs/base.css'],
                data: {
                    md: path.resolve(filePath),
                    root: '/docs/' + (isLackey ? 'lackey/' : 'site/')
                }
            });
        }

        fs.stat(filePath, (error) => {
            if (error) {

                return fs.readdir(path.dirname(filePath), (error2, fileList) => {
                    if (error2) {
                        return next(error2);
                    }


                    let files = [{
                        path: path.dirname(req.path),
                        label: 'Level up'
                        }].concat(fileList.map((file) => {

                        let stat = fs.statSync(path.join(path.dirname(filePath), file));

                        if (!stat.isDirectory() && !file.match(/\.md$/)) {
                            return null;
                        }

                        return {
                            path: path.join(req.path, file),
                            label: file
                        };
                    }));
                    files = files.filter((item) => {
                        return item !== null;
                    });

                    return res.send({
                        template: 'cms/docs/directory',
                        stylesheets: ['css/cms/docs/base.css'],
                        javascripts: [],
                        data: {
                            files: files
                        }
                    });
                });
            }

            print();

        });

    }
});
