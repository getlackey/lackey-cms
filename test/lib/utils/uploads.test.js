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

const uploads = require('../../../lib/utils/uploads'),
    SUtils = require('../../../lib/utils'),
    config = require('../../../lib/configuration'),
    should = require('should'),
    del = require('del'),
    REDDOT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

describe('lib/utils/uploads', () => {

    before(() => {
        return config().then('default', 'test').then(() => {
            return del(__dirname + '/../../../test/mockup/project/uploads/default');
        });
    });

    SUtils.setProjectPath(__dirname + '/../../../test/mockup/project/');

    it('Saves', () => {
        let now = new Date();
        return uploads.save({
            size: 84,
            name: 'red dot.png',
            mime: 'image/png',
            data: REDDOT
        }).then((result) => {
            result.should.be.eql({
                name: 'red dot.png',
                mime: 'image/png',
                size: 84,
                source: {
                    src : 'uploads/' + now.getFullYear() + '/' + now.getMonth() + '/red dot.png'
                }
            });
            return true;
        }).should.finally.be.eql(true);
    });

    it('Saves second', () => {
        let now = new Date();
        return uploads.save({
            size: 84,
            name: 'red dot.png',
            mime: 'image/png',
            data: REDDOT
        }).then((result) => {
            result.should.be.eql({
                name: 'red dot.png',
                mime: 'image/png',
                size: 84,
                source: result.source
            });
            result.source.src.should.match(new RegExp('uploads/' + now.getFullYear() + '/' + now.getMonth() + '/red dot\.(\\d+)\.png'));
            return true;
        }).should.finally.be.eql(true);
    });

    it('Block hacking with wrong mime', () => {
        let now = new Date();
        return uploads.save({
            size: 84,
            name: 'red dot.png',
            mime: 'image/jpg',
            data: REDDOT
        }).should.be.rejected();
    });


    it('Block hacking with wrong path', () => {
        let now = new Date();
        return uploads.save({
            size: 84,
            name: '../../red dot.png',
            mime: 'image/png',
            data: REDDOT
        }).should.be.rejected();
    });

    it('Block hacking with no data', () => {
        let now = new Date();
        return uploads.save({
            size: 84,
            name: 'red dot.png',
            mime: 'image/png'
        }).should.be.rejected();
    });

    it('Block hacking with invalid data', () => {
        let now = new Date();
        return uploads.save({
            size: 84,
            name: 'red dot.png',
            mime: 'image/png',
            data: 'wrongString'
        }).should.be.rejected();
    });

    after(() => {
        return del(__dirname + '/../../../test/mockup/project/uploads/default');
    });

});
*/
