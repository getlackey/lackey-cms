/* jslint esnext:true, node:true, mocha:true */
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
    should = require('should'),
    dbsInit = require('../../../../../test/mockup/dbs');


describe('modules/core/server/models/objection', () => {

    let Objection,
        MongoModel;

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/objection')
                .then((model) => {
                    Objection = model;
                    return;
                }).then(() => {
                    done();
                }, (error) => {
                    /* istanbul ignore next : i don't want to test this */
                    done(error);
                });
        });
    });

    it('Creates, changes, finds and removes', () => {
        return Objection.create({
            name: 'myName'
        }).then((data) => {
            should.exist(data);
            data.id.should.be.eql(1);
            data.name.should.be.eql('myName');
            data.name = 'changedName';
            return data.save();
        }).then((data) => {
            should.exist(data);
            data.id.should.be.eql(1);
            data.name.should.be.eql('changedName');
            return Objection.findById(1);
        }).then((data) => {
            should.exist(data);
            data.id.should.be.eql(1);
            data.name.should.be.eql('changedName');
            return Objection.find();
        }).then((list) => {
            should.exist(list);
            list.length.should.be.eql(1);
            list[0].id.should.be.eql(1);
            list[0].name.should.be.eql('changedName');
            return Objection.removeAll(1);
        }).then((num) => {
            should.exist(num);
            return Objection.findById(1);
        }).then((data) => {
            should.not.exist(data);
        });
    });

    it('Creates without id', () => {

        let obj = new Objection({
            name : 'object'
        });

        return obj.save().then((data) => {
            should.exist(data);
            data.id.should.be.eql(2);
            data.name.should.be.eql('object');
            return Objection.findById(2);
        }).then((data) => {
            should.exist(data);
            data.id.should.be.eql(2);
            data.name.should.be.eql('object');
            return Objection.find();
        }).then((list) => {
            should.exist(list);
            list.length.should.be.eql(1);
            list[0].id.should.be.eql(2);
            list[0].name.should.be.eql('object');
            return Objection.removeAll(1);
        }).then((num) => {
            should.exist(num);
            return Objection.findById(2);
        }).then((data) => {
            should.not.exist(data);
        });
    });
});
