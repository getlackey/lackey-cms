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

const should = require('should'),
    async = require('async'),
    view = require('../../../../lib/server/init/views'),
        path = require('path');

describe('lib/server/init/views', () => {

    let root = path.resolve(path.join(__dirname, '../../../mockup'))

    let resolver = view.resolver('my-site', root + '/lackey/', root + '/project/');

    it('Resolves aboslute path', () => {

        resolver('sites/default/cms/partials/header').should.be.eql(root + '/project/sites/default/modules/cms/shared/views/partials/header.dust');
        resolver('cms/cms/partials/header').should.be.eql(root + '/lackey/modules/cms/server/views/partials/header.dust');


    });

    it('Resolved home dir path', () => {

        resolver('~/cms/partials/header', {
            'view': {
                path: root + '/project/sites/other-site/modules/core/server/views/main.dust'
            }
        }).should.be.eql(root + '/project/sites/other-site/modules/cms/server/views/partials/header.dust');

        resolver('~/cms/partials/header', {
            'view': {
                path: root + '/lackey/modules/core/server/views/main.dust'
            }
        }).should.be.eql(root + '/lackey/modules/cms/server/views/partials/header.dust');

    });

    it('Resolved local path', () => {

        resolver('./partials/header', {
            'view': {
                path: root + '/project/sites/other-site/modules/core/server/views/main.dust'
            }
        }).should.be.eql(root + '/project/sites/other-site/modules/core/server/views/partials/header.dust');

    });

    it('Enableds typeof helper', () => {
        let chunk = {
            _list: [],
            write: (val) => {
                chunk._list.push(val);
            }
        };
        view.typeof(chunk, {}, {}, {});
        view.typeof(chunk, {}, {}, {
            val: 1
        });
        view.typeof(chunk, {}, {}, {
            val: '1'
        });
        view.typeof(chunk, {}, {}, {
            val: {}
        });
        view.typeof(chunk, {}, {}, {
            val: []
        });
        view.typeof(chunk, {}, {}, {
            val: true
        });
        view.typeof(chunk, {}, {}, {
            val: false
        });
        view.typeof(chunk, {}, {}, {
            val: null
        });

        chunk._list.should.be.eql([
            'undefined',
            'number',
            'string',
            'object',
            'object',
            'boolean',
            'boolean',
            'object'
        ]);
    });

});
