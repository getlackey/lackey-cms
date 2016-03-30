/* jslint esnext:true, node:true, mocha:true */
'use strict';
/*
    Copyright 2016 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the 'License');
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an 'AS IS' BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
if (!GLOBAL.LACKEY_PATH) {
    /* istanbul ignore next */
    GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const
    dbsInit = require('../../../../../test/mockup/dbs'),
    Generator = require(LACKEY_PATH).generator,
    should = require('should');

describe('modules/media/server/models/media', () => {

    let MediaModel,
        MediaGenerator,
        SOURCE = 'http://lorempixel.com/400/200/?rnd=test';

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/media')
                .then((media) => {
                    MediaModel = media;
                    MediaModel.debug = 'image/jpeg';
                    MediaGenerator = require('../../../server/models/media/generator');
                    done();
                });
        });
    });

    it('gets mime from path', () => {
        let tests = [{
                input: 'a.jpg',
                output: 'image/jpeg'
         }, {
                input: SOURCE,
                output: 'image/jpeg'
         }],
            promise = Promise.resolve(true);

        tests.forEach((test) => {
            promise = MediaModel.lookupMime(test.input).then((mime) => {
                mime.should.be.eql(test.output);
                return true;
            });
        });

        return promise;
    });

    it('should begin with no content', function () {
        return MediaModel.removeAll()
            .then(() => {
                return MediaModel.count();
            }).then((count) => {
                count.should.be.eql(0);
                return true;
            }).should.finally.be.eql(true);
    });

    describe('Gets default source', () => {

        it('Just string', () => {
            return MediaModel.mapSource(SOURCE).should.finally.be.eql({
                source: SOURCE,
                type: 'image',
                mime: 'image/jpeg',
                alternatives: []
            });
        });

        it('Source field', () => {

            let input = {
                source: SOURCE
            };

            return MediaModel.mapSource(input).should.finally.be.eql({
                source: SOURCE,
                type: 'image',
                mime: 'image/jpeg',
                alternatives: []
            });

        });

        it('Source with videos and image', () => {

            let input = {
                source: {
                    'video/mp4': 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                    'video/webm': 'http://clips.vorwaerts-gmbh.de/VfE.webm',
                    'video/ogg': 'http://clips.vorwaerts-gmbh.de/VfE.ogv',
                    'image': SOURCE
                }
            };

            return MediaModel.mapSource(input).should.finally.be.eql({
                source: 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                type: 'video',
                mime: 'video/mp4',
                alternatives: [{
                    src: 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                    type: 'video/mp4'
            }, {
                    src: 'http://clips.vorwaerts-gmbh.de/VfE.webm',
                    type: 'video/webm'
            }, {
                    src: 'http://clips.vorwaerts-gmbh.de/VfE.ogv',
                    type: 'video/ogg'
            }, {
                    src: SOURCE,
                    type: 'image/jpeg'
            }]
            });


        });

        it('Source with videos (nested)', () => {

            let input = {
                source: {
                    'video/mp4': [{
                        media: 'all and (min-width: 300px)',
                        src: 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4'
                }, {
                        media: 'all and (min-width: 600px)',
                        src: 'http://clips.vorwaerts-gmbh.de/VfE_html5B.mp4'
                }],
                    'video/webm': 'http://clips.vorwaerts-gmbh.de/VfE.webm',
                    'video/ogg': 'http://clips.vorwaerts-gmbh.de/VfE.ogv',
                }
            };

            return MediaModel.mapSource(input).should.finally.be.eql({
                source: 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                type: 'video',
                mime: 'video/mp4',
                alternatives: [{
                    media: 'all and (min-width: 300px)',
                    src: 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                    type: 'video/mp4'
                }, {
                    media: 'all and (min-width: 600px)',
                    src: 'http://clips.vorwaerts-gmbh.de/VfE_html5B.mp4',
                    type: 'video/mp4'
                }, {
                    src: 'http://clips.vorwaerts-gmbh.de/VfE.webm',
                    type: 'video/webm'
                }, {
                    src: 'http://clips.vorwaerts-gmbh.de/VfE.ogv',
                    type: 'video/ogg'
                }]
            });

        });

        it('Source with videos', () => {

            let input = {
                source: {
                    'video/mp4': 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                    'video/webm': 'http://clips.vorwaerts-gmbh.de/VfE.webm',
                    'video/ogg': 'http://clips.vorwaerts-gmbh.de/VfE.ogv'
                }
            };

            return MediaModel.mapSource(input).should.finally.be.eql({
                source: 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                type: 'video',
                mime: 'video/mp4',
                alternatives: [{
                    src: 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4',
                    type: 'video/mp4'
            }, {
                    src: 'http://clips.vorwaerts-gmbh.de/VfE.webm',
                    type: 'video/webm'
            }, {
                    src: 'http://clips.vorwaerts-gmbh.de/VfE.ogv',
                    type: 'video/ogg'
            }]
            });

        });

        it('Image source sets with default', () => {

            let input = {
                source: [
                SOURCE,
                    {
                        dimension: '600w 200h 1x',
                        src: 'http://lorempixel.com/600/200/?rnd=test'
                }, {
                        dimension: '600w 200h 2x',
                        src: 'http://lorempixel.com/1200/400/?rnd=test'
                }, {
                        dimension: '1200w',
                        src: 'http://lorempixel.com/1200/400/?rnd=test'
                }, {
                        dimension: '200w 200h',
                        src: 'http://lorempixel.com/200/200/?rnd=test'
                }, {
                        dimension: '3x',
                        src: 'http://lorempixel.com/1800/600/?rnd=test'
                }]
            };

            return MediaModel.mapSource(input).should.finally.be.eql({
                source: SOURCE,
                type: 'image',
                mime: 'image/jpeg',
                srcset: SOURCE + ',http://lorempixel.com/600/200/?rnd=test 600w 200h 1x,' +
                    'http://lorempixel.com/1200/400/?rnd=test 600w 200h 2x,' +
                    'http://lorempixel.com/1200/400/?rnd=test 1200w,' +
                    'http://lorempixel.com/200/200/?rnd=test 200w 200h,' +
                    'http://lorempixel.com/1800/600/?rnd=test 3x'
            });


        });

        it('Image source sets', () => {

            let input = {
                source: [
                    {
                        dimension: '600w 200h 1x',
                        src: SOURCE
                }, {
                        dimension: '600w 200h 2x',
                        src: 'http://lorempixel.com/1200/400/?rnd=test'
                }, {
                        dimension: '1200w',
                        src: 'http://lorempixel.com/1200/400/?rnd=test'
                }, {
                        dimension: '200w 200h',
                        src: 'http://lorempixel.com/200/200/?rnd=test'
                }, {
                        dimension: '3x',
                        src: 'http://lorempixel.com/1800/600/?rnd=test'
                }]
            };

            return MediaModel.mapSource(input).should.finally.be.eql({
                source: SOURCE,
                type: 'image',
                mime: 'image/jpeg',
                srcset: SOURCE + ' 600w 200h 1x,' +
                    'http://lorempixel.com/1200/400/?rnd=test 600w 200h 2x,' +
                    'http://lorempixel.com/1200/400/?rnd=test 1200w,' +
                    'http://lorempixel.com/200/200/?rnd=test 200w 200h,' +
                    'http://lorempixel.com/1800/600/?rnd=test 3x'
            });

        });
    });

    it('Creates', () => {
        return MediaModel.create({
            name: 'picture',
            source: 'http://lorempixel.com/400/200/?rnd=test'
        }).then((media) => {
            let json = media.toJSON();
            json.name.should.be.eql(media.name);
            return MediaModel.findById(media.id);
        }).then((media) => {
            should.exist(media);
            return true;
        }).should.finally.be.eql(true);
    });

    it('Queries', () => {
        return MediaModel.list({}).then(() => {
            return true; //TODO: improve
        }).should.finally.be.True;
    });


    it('Imports', () => {
        Generator.registerMapper('Media', MediaGenerator);
        return Generator.load(__dirname + '/../../../module.yml', true).then(() => {
            return true;
        }).should.finally.be.eql(true);
    });
});
