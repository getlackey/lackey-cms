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

const Plugin = require('../../../lib/runtime/Plugin'),
    BbPromise = require('bluebird');


describe('lib/runtime/Plugin', () => {
    it('Inits', () => {
        let plugin = new Plugin({
            name: 'abc',
            sites: {
                'default': 1
            }
        });
        plugin.S.should.be.eql({
            name: 'abc',
            sites: {
                'default': 1
            }
        });

        Plugin.getName().should.be.eql('com.yourdomain.LackeyPlugin');

        return BbPromise.all([
            plugin.registerActions().should.finally.be.fullfiled,
            plugin.registerHooks().should.finally.be.fullfiled,
            plugin.cliPromptInput().should.finally.be.fullfiled,
            plugin.cliPromptSelect('mgs', ['default'], 'default', 'done').should.be.rejected(),
            plugin.cliPromptSelectSite('mgs', null).should.finally.be.fullfiled,
            plugin.cliPromptSelectSite('mgs', 'default').should.finally.be.fullfiled
        ]);
    });
});
