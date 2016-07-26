/* jslint node:true, esnext:true, mocha:true, -W030 */
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
    server = require('../../../lib/server'),
    configuration = require('../../../lib/configuration'),
    Generator = require('../../../lib/generator'),
    SUtils = require('../../../lib/utils'),
    should = require('should');

function testServer(title, config, overrides) {
    it(title, () => {
        configuration.unload();
        Generator.cleanup();
        SUtils.setProjectPath(__dirname + '/../../../test/mockup/project/');
        return server(config, overrides)
            .then((instance) => {
                return instance.init()
                    .then(() => {
                        let dumb = {};
                        instance.setModule('cms/dumb', dumb);
                        instance.getModule('cms/dumb').should.be.equal(dumb);
                        should.exist(instance.getExpress());
                        should.exist(instance.getConfig());
                        return instance.stop();

                    })
                    .then(() => {
                        return true;
                    })
                    .should.finally.be.eql(true);
            });
    });
}

describe('lib/server', () => {

    testServer('Works with drop', {
        stage: 'test',
        site: 'default'
    }, {
        yml: {
            drop: true
        }
    });

    testServer('Works without drop', {
        stage: 'test',
        site: 'default'
    });

    testServer('Works without drop', {
        stage: 'test',
        site: 'default'
    }, {
        yml: {
            override: '*'
        }
    });

    testServer('Works with limited overrides', {
        stage: 'test',
        site: 'default'
    }, {
        yml: {
            override: ['User']
        }
    });

    after(() => {
        (server.instance === null).should.be.True;
    });
});
