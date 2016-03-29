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

const siteRun = require('../../../../lib/runtime/actions/SiteRun'),
    path = require('path'),
    BbPromise = require('bluebird'),
    plugin = require('../../../mockup/plugin'),
    libPath = path.resolve(__dirname + '/../../../../lib') + '/';

describe('lib/runtime/actions/SiteRun', () => {

    let Run,
        instance;

    it('Imports', () => {
        Run = siteRun(plugin, libPath + 'runtime/');
    });

    it('Creates', () => {
        let
            context = null,
            data = null,
            S = {
                addAction: (_context, _data) => {
                    context = _context;
                    data = _data;
                },
                validateProject: () => {
                    return BbPromise.resolve();
                }
            },
            config = {};

        instance = new Run(S, config);
        Run.getName().should.be.eql('lackey.core.SiteRun');
        instance.registerActions().should.finally.be.fullfiled;

        data.should.be.eql({
            handler: 'siteRun',
            description: 'Runs specificed site\nUsage: lackey site run',
            context: 'site',
            contextAction: 'run',
            options: [
                {
                    option: 'site',
                    shortcut: 's',
                    description: 'site id you want to use'
          },
                {
                    option: 'stage',
                    shortcut: 's',
                    description: 'stage you want use'
          },
                {
                    option: 'nonInteractive',
                    shortcut: 'i',
                    description: 'Optional - Turn off CLI interactivity if true. Default: false'
          },
        ]

        });

    });

    it('Runs', () => {
        return instance.siteRun({
            site: 'default',
            stage: 'test'
        }).should.finally.be.eql({
            site: 'default',
            stage: 'test'
        });
    });

    it('Fails', () => {
        return BbPromise.all([
         instance.siteRun({
                site: null,
                stage: 'test'
            }).should.be.rejected(),
            instance.siteRun({
                site: 'default',
                stage: null
            }).should.be.rejected(),
            instance.siteRun({
                site: null,
                stage: null
            }).should.be.rejected()
            ]);
    });


});
