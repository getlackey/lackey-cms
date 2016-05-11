/* jslint node:true, esnext:true, mocha:true */
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
    dbsInit = require('../../../../../test/mockup/dbs'),
    should = require('should'),
    Generator = require(LACKEY_PATH).generator;

describe('modules/users/server/models/role', () => {

    let Role, RoleGenerator, lock = false;

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/role')
                .then((role) => {
                    Role = role;
                })
                .then(() => {
                    RoleGenerator = require('../../../server/models/role/generator');
                    return Role.removeAll();
                })
                .then(() => {
                    done();
                }, (error) => {
                    /* istanbul ignore next */
                    done(error);
                });
        });
    });

    it('Loads init data', () => {
        Generator.registerMapper('Role', RoleGenerator);
        return Generator.load(__dirname + '/../../../module.yml', true)
            .then(() => {
                return Role.roleNames();
            })
            .then((roles) => {
                roles.sort().should.be.eql([
                    'admin',
                    'developer',
                    'gold',
                    'guest',
                    'silver'
                ]);
                Role.getByName('developer').acl.cms.should.be.eql('*');
                Role.getByName('developer').acl.debug.should.be.eql('*');
                Role.getByName('developer').acl.viewas.should.be.eql('*');
                should.not.exist(Role.getByName('developer').acl.easteregg);
                lock = true;
                return true;
            })
            .should.finally.be.eql(true);
    });

});
