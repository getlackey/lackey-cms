/* jslint node:true, esnext:true */
/* globals LACKEY_PATH, window */
'use strict';

const
    Model = require('objection').Model,
    SCli = require(LACKEY_PATH).cli,
    _ = require('lodash'),
    atomus = require('atomus');

let
    format,
    parseFrom,
    toMarkdown,
    model,
    Schema,
    Block,
    defaultSchema,
    Inline,
    Attribute,
    TextBlock,
    toText,
    dom,
    elt;



module.exports = () => new Promise((resolve, reject) => {
        atomus()
            .html('<html></html>')
            .ready(function (errors, window) {
                try {
                    if (errors) {
                        return reject(errors);
                    }
                    GLOBAL.window = window;
                    GLOBAL.navigator = window.navigator;
                    GLOBAL.document = window.document;
                    format = require('prosemirror/dist/format');
                    parseFrom = format.parseFrom;
                    toMarkdown = require('prosemirror/dist/markdown').toMarkdown;
                    model = require('prosemirror/dist/model');
                    Schema = model.Schema;
                    Block = require('prosemirror/dist/model/schema').Block;
                    defaultSchema = model.defaultSchema;
                    Inline = model.Inline;
                    Attribute = model.Attribute;
                    TextBlock = require('prosemirror/dist/model/schema').Textblock;
                    toText = format.toText;
                    dom = require('prosemirror/dist/dom');
                    elt = dom.elt;

                    //DUST
                    class Dust extends Inline {
                        get attrs() {
                            return {
                                template: new Attribute('')
                            };
                        }
                    }

                    Dust.register('parseDOM', 'dust-template', {
                        rank: 25,
                        parse: function (domObj, state) {
                            let type = domObj.getAttribute('template');
                            if (!type) {
                                return false;
                            }
                            state.insert(this, {
                                type
                            });
                        }
                    });

                    Dust.prototype.serializeDOM = node => elt('dust-template', {
                        'template': node.attrs.template
                    }, node.attrs.template);


                    //TWITTABLE
                    class Twitterable extends TextBlock {
                        get attrs() {
                            return {};
                        }
                        get contains() {
                            return 'text';
                        }
                        get containsMarks() {
                            return false;
                        }
                    }

                    Twitterable.register('parseDOM', 'a', {
                        rank: 25,
                        parse: function (domObj, state) {

                            let className = domObj.getAttribute('class');
                            if (className !== 'tweetable') {
                                return false;
                            }

                            state.wrapIn(this, {
                                type: this.type
                            });
                        }
                    });

                    Twitterable.prototype.serializeMarkdown = function (state, node) {
                        state.wrapBlock('> ', null, node, function () {
                            return state.renderContent(node);
                        });
                    };

                    Twitterable.prototype.serializeDOM = (node, serializer) => {
                        try {
                            let innerContent = '',
                                innerContentClear = '',
                                attributes = {
                                    class: 'tweetable'
                                };

                            if (node.rendered) {
                                node.rendered = node.rendered.cloneNode(true);
                            } else {

                                if (node && node.content && node.content.content && node.content.content[0].type) {
                                    innerContent = serializer.renderAs(node.content.content[0], 'p');
                                    innerContentClear = toText(node.content.content[0]);
                                }

                                if (serializer.options.serverSide === true) {
                                    attributes.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(innerContentClear + ' ' + serializer.options.uri);
                                    attributes.target = '_blank';
                                }

                                node.rendered = elt('a', attributes, [elt('blockquote', {
                                    'pm-container': true
                                }, innerContent)]);

                            }
                        } catch (e) {
                            console.error(e);
                        }
                        return node.rendered;
                    };

                    //IFRAME
                    class Website extends Block {
                        get attrs() {
                            return {
                                src: new Attribute(),
                                width: new Attribute({
                                    default: 200
                                }),
                                height: new Attribute({
                                    default: 200
                                })
                            };
                        }
                        get contains() {
                            return null;
                        }
                    }

                    Website.prototype.serializeDOM = (node, s) => s.renderAs(node, 'iframe', {
                        src: node.attrs.src,
                        content: 'text/html;charset=UTF-8',
                        frameborder: '0',
                        allowfullscreen: '1'
                    });

                    Website.prototype.serializeMarkdown = (s, node) => {
                        s.write('[IFRAME](' + s.esc(node.attrs.src) + ')');
                    };

                    Website.register('parseDOM', 'a', {
                        rank: 25,
                        parse: function (domObj, state) {

                            if (domObj.innerTex !== 'IFRAME') {
                                return false;
                            }

                            state.wrapIn(this, {
                                type: this.type,
                                src: domObj.href
                            });
                        }
                    });

                    let LackeySchema = new Schema(defaultSchema.spec.update({
                        dust: Dust,
                        twitterable: Twitterable,
                        iframe: Website
                    }));

                    LackeySchema.newDoc = (id) => {
                        let block = {
                            type: 'doc',
                            content: [{
                                type: 'paragraph',
                                content: []
                        }]
                        };
                        if (id) {
                            block.id = id;
                        }
                        return block;
                    };


                    window.LackeySchema = LackeySchema;
                    resolve(window);
                } catch (err) {
                    return reject(err);
                }
            });
    })
    .then(() => {

        class ContentModel extends Model {
            static get tableName() {
                return 'content';
            }
        }

        function crawlBack(data) {
            if (data) {
                if (data.type === 'doc') {
                    return Promise.resolve(toMarkdown(parseFrom(window.LackeySchema, data, 'json')).replace(/\s\s\r\n/g, ' \\n'));
                }
            } else {
                return Promise.resolve(null);
            }

            let promises = [];

    ['fields', 'variants', 'items']
            .forEach(group => {
                if (data[group]) {
                    Object.keys(data[group])
                        .forEach(key => {
                            let content = data[group][key];
                            promises.push(crawlBack(content)
                                .then(output => {
                                    data[group][key] = output;
                                }));
                        });
                }
            });

            if (data.type === 'Fields' || data.type === 'Variants') {
                Object.keys(data)
                    .forEach(key => {
                        if (['type'].indexOf(key) === -1) {
                            let content = data[key];
                            promises.push(crawlBack(content)
                                .then(output => {
                                    data[key] = output;
                                }));
                        }
                    });
            }

            if (promises.length) {
                return Promise.all(promises)
                    .then(() => {
                        return data;
                    });
            }
            return Promise.resolve(data);
        }

        return SCli
            .sql(ContentModel
                .query()
                .select('id', 'layout')
            )
            .then(list => {
                return Promise
                    .all(list
                        .map(page => {
                            let output = _.cloneDeep(page.layout);
                            return crawlBack(output)
                                .then(layout => {
                                    return SCli
                                        .sql(
                                            ContentModel
                                            .query()
                                            .patch({
                                                layout: layout
                                            })
                                            .where('id', page.id)
                                        );
                                });
                        }));
            })
            .catch(error => console.error(error));
    });
