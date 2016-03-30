/* jslint node:true, esnext:true, mocha:true */
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

const should = require('should'),
    treeParser = require('../../shared/treeparser');

describe('modules/cms/shared/treeparser', () => {

    const COMPLEX = {
        type: 'Variants',
        'hero:online:en': 'Online',
        'hero:offline:en': 'Offline',
        '*': 'DefaultEnglish',
        '*:online:pl': 'W sieci',
        '*:offline:pl': 'Wyłączony'
    };

    describe('Getter', () => {

        const cases = [
            // flat text
            {
                root: 'Text',
                output: 'Text'
            },
            // markdown or html
            {
                root: 'Text\n\n[Abc](link) <b>html</b>',
                output: 'Text\n\n[Abc](link) <b>html</b>'
            },
            // ProseMirror node
            {
                root: {
                    type: 'doc'
                },
                output: {
                    type: 'doc'
                }
            },
            // Composite - not used anymore, but we use it for port testing
            {
                root: {
                    fields: {
                        text: 'Text'
                    }
                },
                path: 'fields.text',
                output: 'Text'
            },
            // Variant fallback to flat
            {
                root: 'Text',
                variant: 'demo',
                output: 'Text'
            },
            // State fallback to flat
            {
                root: 'Text',
                state: 'online',
                output: 'Text'
            },
            // State fallback to flat
            {
                root: 'Text',
                locale: 'pl',
                output: 'Text'
            },
            // By locale where defaults are not defined
            {
                root: COMPLEX,
                locale: 'pl',
                output: 'DefaultEnglish'
            },
            // By locale and state
            {
                root: COMPLEX,
                locale: 'pl',
                state: 'online',
                output: 'W sieci'
            },
            // Locale and variant to defaults
            {
                root: COMPLEX,
                locale: 'de',
                output: 'DefaultEnglish'
            },
            // Most precise
            {
                root: COMPLEX,
                locale: 'en',
                variant: 'hero',
                state: 'offline',
                output: 'Offline'
            },
            // Most precise - variant missing
            {
                root: COMPLEX,
                locale: 'pl',
                variant: 'hero',
                state: 'offline',
                output: 'Wyłączony'
            },
            // paths
            {
                root: {
                    type: 'Block',
                    fields: {
                        title: COMPLEX
                    }
                },
                path: 'fields.title',
                locale: 'pl',
                variant: 'hero',
                state: 'offline',
                output: 'Wyłączony'
            },
            // paths 2
            {
                root: {
                    type: 'List',
                    items: [
                        {},
                        {},
                        {
                            type: 'Block',
                            fields: {
                                title: COMPLEX
                            }
                }
                    ]
                },
                path: 'items.2.fields.title',
                locale: 'pl',
                variant: 'hero',
                state: 'offline',
                output: 'Wyłączony'
            },
            {
                root: {
                    image: {
                        '*': {
                            'type': 'Media',
                            'id': 4
                        },
                        'type': 'Variants',
                        '*:*:pl': {
                            'type': 'Media',
                            'id': '3'
                        }
                    },
                },
                output: {
                    'type': 'Media',
                    'id': '3'
                },
                path: 'image',
                variant: 'hero',
                locale: 'pl'
            }
        ];

        cases.forEach((item) => {
            let filter = {
                path: item.path,
                variant: item.variant,
                state: item.state,
                locale: item.locale
            };
            it(JSON.stringify(filter) + ' = ' + item.output, () => {
                if (item.output === undefined) {
                    should.not.exist(treeParser
                        .get(item.root, item.path, item.variant, item.state, item.locale));
                } else {
                    treeParser
                        .get(item.root, item.path, item.variant, item.state, item.locale)
                        .should.be.eql(item.output);
                }
            });
        });

    });

    describe('Setter', () => {

        const cases = [
            {
                root: 'Text',
                value: 'Text 2',
                error: true
            },
            {
                root: {
                    text: 'Text'
                },
                path: 'text',
                value: 'Text 2',
                output: {
                    text: 'Text 2'
                }
            },
            {
                root: {
                    fields: {
                        text: 'Text'
                    }
                },
                path: 'fields.text',
                value: 'Text 2',
                output: {
                    fields: {
                        text: 'Text 2'
                    }
                }
            },
            {
                root: {
                    fields: {
                        text: 'Text'
                    }
                },
                path: 'fields.text',
                value: 'Text 2',
                variant: 'hero',
                output: {
                    fields: {
                        text: {
                            '*': 'Text',
                            'hero:*': 'Text 2',
                            type: 'Variants'
                        }
                    }
                }
            },
            {
                root: {
                    text: {
                        '*': 'wildcard',
                        'hero:*': 'hero',
                        '*:*:pl': 'Polish'
                    }
                },
                value: 'dummy',
                path: 'text',
                variant: 'hero',
                locale: 'pl',
                state: '1',
                output: {
                    text: {
                        '*': 'wildcard',
                        'hero:*': 'hero',
                        '*:*:pl': 'Polish',
                        'hero:1:pl': 'dummy',
                        type: 'Variants'
                    }
                }
            },
            {
                root: {
                    text: {
                        '*': 'wildcard',
                        'hero:*': 'hero',
                        '*:*:pl': 'Polish'
                    }
                },
                path: 'text',
                value: 'dummy',
                variant: 'hero',
                locale: 'pl',
                output: {
                    text: {
                        '*': 'wildcard',
                        'hero:*': 'hero',
                        '*:*:pl': 'Polish',
                        'hero:*:pl': 'dummy',
                        type: 'Variants'
                    }
                }
            },
            {
                root: {
                    text: {
                        id: 1,
                        type: 'Media'
                    }
                },
                path: 'text',
                value: 'dummy',
                variant: 'hero',
                locale: 'pl',
                output: {
                    text: {
                        '*': {
                            id: 1,
                            type: 'Media'
                        },
                        'hero:*:pl': 'dummy',
                        type: 'Variants'
                    }
                }
            },
            {
                root: {
                    text: {
                        id: 1,
                        type: 'Media'
                    }
                },
                path: 'text',
                value: 'dummy',
                output: {
                    text: 'dummy'
                }
            },
            {
                root: {
                    title: {
                        type: 'doc',
                        content: [{
                            type: 'paragraph',
                            content: [{
                                type: 'text',
                                text: 'We are Enigma Marketing'
                            }]
                        }]
                    }
                },
                path: 'title',
                locale: 'pl',
                value: 'dummy',
                output: {
                    title: {
                        type: 'Variants',
                        '*': {
                            type: 'doc',
                            content: [{
                                type: 'paragraph',
                                content: [{
                                    type: 'text',
                                    text: 'We are Enigma Marketing'
                                    }]
                            }]
                        },
                        '*:*:pl': 'dummy'
                    }
                }
             }
            ];

        cases.forEach((item) => {
            it(JSON.stringify(item), () => {
                let hasError = false;
                try {
                    treeParser
                        .set(item.root, item.path, item.value, item.variant, item.state, item.locale);
                } catch (error) {
                    hasError = true;
                }
                if (item.error) {
                    hasError.should.be.eql(true);
                } else {
                    item.root.should.be.eql(item.output);
                }
            });
        });

    });

});
