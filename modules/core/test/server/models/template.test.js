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
    dbsInit = require('../../../../../test/mockup/dbs'),
    Generator = require(LACKEY_PATH).generator;
require('should');

describe('models/cms/server/models/template', () => {

    let TemplateModel,
        TemplateGenerator;

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/template')
                .then((model) => {
                    TemplateModel = model;
                    TemplateGenerator = require('../../../server/models/template/generator');
                    done();
                });
        });
    });

    it('Should begin with no content', function () {
        return TemplateModel
            .removeAll()
            .then(() => {
                return TemplateModel.count();
            })
            .then((count) => {
                count.should.be.eql(0);
                return true;
            })
            .should.finally.be.eql(true);
    });

    it('Creates', () => {
        return TemplateModel
            .create({
                name: 'my page',
                path: 'page/template',
                javascripts: ['js1', 'js2'],
                stylesheets: ['css1', 'css2'],
                selectable: true,
                require: ['auth']
            })
            .then((result) => {
                let json = result.toJSON();
                json.should.be.eql({
                    expose: [],
                    populate: [],
                    id: json.id,
                    name: 'my page',
                    path: 'page/template',
                    javascripts: ["js1", "js2"],
                    stylesheets: ["css1", "css2"],
                    props: {
                        og_description: {
                            label: "Description (used in OpenGraph)",
                            name: "og_description"
                        },
                        og_image: {
                            label: "Image (used in OpenGraph)",
                            name: "og_image",
                            type: "media"
                        },
                        og_title: {
                            label: "Title (used in OpenGraph)",
                            name: "og_title"
                        },
                        og_type: {
                            label: "Type (used in OpenGraph)",
                            name: "og_type"
                        },
                    },
                    selectable: true,
                    allowTaxonomies: [],
                    editable: true,
                    thumb: null,
                    type: 'template',
                    prefix: '',
                    require: ['auth'],
                    taxonomies: [],
                    variants: []

                });
                result.name.should.be.eql('my page');
                result.path.should.be.eql('page/template');

                return TemplateModel.create({
                    name: 'my page',
                    path: 'page/template2',
                    javascripts: ['js1', 'js2'],
                    stylesheets: ['css1', 'css2'],
                    selectable: true
                });
            })
            .then(() => true)
            .should.finally.be.eql(true);
    });

    it('Gets selectable', () => {
        return TemplateModel
            .selectable({
                isAllowed: () => {
                    return true;
                }
            });
    });

    it('Queries', () => {
        return TemplateModel
            .list({})
            .then(() => {
                return true; //TODO: improve
            }).should.finally.be.True;
    });

    it('Generates init data', () => {
        Generator.registerMapper('Template', TemplateGenerator);
        return Generator
            .load(__dirname + '/../../../module.yml', true)
            .then(() => {
                return true;
            })
            .should.finally.be.eql(true);
    });

});
