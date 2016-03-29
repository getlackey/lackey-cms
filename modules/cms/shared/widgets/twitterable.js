/* jslint esnext:true, node:true */
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
const Schema = require('prosemirror/dist/model/schema'),
    dom = require('prosemirror/dist/dom'),
    format = require('prosemirror/dist/format'),
    TextBlock = Schema.Textblock,
    toText = format.toText,
    elt = dom.elt;

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
        if (className !== 'twitterable') {
            return false;
        }

        state.wrapIn(this, {
            type: this.type
        });
    }
});

Twitterable.prototype.serializeDOM = (node, serializer) => {

    let innerContent = '',
        innerContentClear = '',
        attributes = {
            class: 'twitterable'
        };

    if (node.rendered) {
        node.rendered = node.rendered.cloneNode(true);
    } else {
        try {
            if (node && node.content && node.content.content && node.content.content[0].type) {
                innerContent = serializer.renderAs(node.content.content[0], 'p');
                innerContentClear = toText(node.content.content[0]);
            }
        } catch (e) {
            console.error(e);
        }
        if (serializer.options.serverSide === true) {
            attributes.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(innerContentClear + ' ' + serializer.options.uri);
        }

        node.rendered = elt('a', attributes, [elt('blockquote', {}, innerContent)]);

    }
    return node.rendered;
};

Twitterable.register('command', 'insert', {
    label: 'Wrap the selection in a block quote',
    'display': {
        'type': 'icon',
        'width': 1500,
        'height': 1200,
        'path': 'm1366.9 989.39c-50.27-22.309-104.33-37.387-161.05-44.18 57.89 34.723 102.34 89.679 123.28 155.15-54.18-32.15-114.18-55.47-178.09-68.04-51.13 54.49-124.02 88.55-204.68 88.55-154.89 0-280.43-125.55-280.43-280.43 0-21.988 2.457-43.398 7.258-63.91-233.08 11.68-439.72 123.36-578.04 293.01-24.141-41.4-37.969-89.567-37.969-140.97 0-97.308 49.489-183.13 124.76-233.44-45.969 1.437-89.218 14.058-127.03 35.078-0.043-1.18-0.043-2.348-0.043-3.52 0-135.9 96.68-249.22 224.96-275-23.512-6.41-48.281-9.8-73.86-9.8-18.089 0-35.628 1.711-52.781 5 35.711-111.41 139.26-192.5 262-194.77-96.058-75.23-216.96-120.04-348.36-120.04-22.621 0-44.961 1.332-66.918 3.91 124.16-79.568 271.55-125.98 429.94-125.98 515.82 0 797.86 427.31 797.86 797.93 0 12.153-0.28 24.223-0.79 36.25 54.77 39.571 102.31 88.95 139.93 145.2'
    },
    run(pm) {
        let content = pm.doc.sliceBetween(pm.selection.from, pm.selection.to),
            node = this.create(null, content.content);
        return pm.tr.replaceSelection(node).apply();
    },
    menuGroup: 'block(46)'
});

Twitterable.register('insertMenu', 'main', {
    label: 'Twitterable',
    command: 'insert',
    rank: 1
});


module.exports.Twitterable = Twitterable;
