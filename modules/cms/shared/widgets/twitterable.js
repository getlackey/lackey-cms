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
        if (className !== 'tweetable') {
            return false;
        }

        state.wrapIn(this, {
            type: this.type
        });
    }
});

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

Twitterable.register('command', 'insert', {
    label: 'Wrap the selection in a block quote',
    menu: {
        group: 'block',
        rank: 72,
        display: {
            label: 'Tweetable',
            'type': 'icon',
            'width': 18.438,
            'height': 14.656,
            'path': 'M18.449,1.744 C17.771,2.038 17.041,2.237 16.276,2.326 C17.057,1.869 17.657,1.143 17.940,0.279 C17.208,0.703 16.399,1.011 15.537,1.177 C14.847,0.458 13.863,0.009 12.775,0.009 C10.685,0.009 8.992,1.665 8.992,3.708 C8.992,3.998 9.025,4.281 9.090,4.552 C5.945,4.398 3.157,2.925 1.291,0.686 C0.966,1.232 0.779,1.868 0.779,2.546 C0.779,3.829 1.447,4.962 2.462,5.626 C1.842,5.606 1.258,5.439 0.748,5.163 C0.748,5.178 0.748,5.193 0.748,5.209 C0.748,7.002 2.052,8.497 3.783,8.837 C3.465,8.922 3.131,8.967 2.786,8.967 C2.542,8.967 2.305,8.944 2.074,8.900 C2.556,10.369 3.953,11.440 5.609,11.469 C4.314,12.462 2.683,13.053 0.910,13.053 C0.604,13.053 0.303,13.036 0.007,13.002 C1.682,14.051 3.670,14.664 5.807,14.664 C12.766,14.664 16.572,9.026 16.572,4.137 C16.572,3.977 16.569,3.818 16.561,3.658 C17.300,3.136 17.942,2.486 18.449,1.744 Z'
        }
    },
    run(pm) {
        let content = pm.doc.cut(pm.selection.from, pm.selection.to),
            node = this.create(null, content.content);
        return pm.tr.replaceSelection(node).apply();
    }
});

Twitterable.register('insertMenu', 'main', {
    label: 'Twitterable',
    command: 'insert',
    rank: 1
});


module.exports.Twitterable = Twitterable;
