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

const siteDebug = require('../../../../lib/runtime/actions/SiteDebug'),
    path = require('path'),
    BbPromise = require('bluebird'),
    plugin = require('../../../mockup/plugin'),
    libPath = path.resolve(__dirname + '/../../../../lib') + '/';

describe('lib/runtime/actions/SiteDebug', () => {

    let Debug,
        instance;

    it('Imports', () => {
        Debug = siteDebug(plugin, libPath + 'runtime/');
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

        instance = new Debug(S, config);
        Debug.getName().should.be.eql('lackey.core.SiteDebug');
        instance.registerActions().should.finally.be.fullfiled;

        data.should.be.eql({
            handler: 'siteDebug',
            description: `Runs specificed site in debug mode
Usage: lackey site run`,
            context: 'site',
            contextAction: 'debug',
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
        return instance.siteDebug({
            site: 'default',
            stage: 'test'
        }).should.finally.be.eql({
            exec: 'node --harmony',
            debug: true,
            ext: 'js json sass yml scss',
            ignore: ['*/htdocs/*'],
            script: libPath + 'server/debug.js',
            stdout: true,
            ignoreRoot: [
              ".git"
            ]
        });
    });

    it('Fails', () => {
        return BbPromise.all([
         instance.siteDebug({
                site: null,
                stage: 'test'
            }).should.be.rejected(),
            instance.siteDebug({
                site: 'default',
                stage: null
            }).should.be.rejected(),
            instance.siteDebug({
                site: null,
                stage: null
            }).should.be.rejected()
            ]);
    });


});
