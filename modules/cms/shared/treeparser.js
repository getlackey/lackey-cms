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

const bestmatch = require('bestmatch'),
    SEP = ':';


function parse(value, variant, state, locale) {

    if (!value || !value.type || !value.variants) {
        return value;
    }

    let
        filter = module.exports.pattern(variant, state, locale),
        map = {},
        variants = Object.keys(value.variants).map(function (rule) {
            let ruleParts = rule.split(SEP),
                result;
            while (ruleParts.length < 3) {
                ruleParts.push('*');
            }
            result = ruleParts.join(SEP);
            map[result] = rule;
            return result;
        }),
        key = map[bestmatch(variants, filter)];
    return value.variants[key];
}

module.exports.pattern = (variant, state, locale) => {
    if (!variant && !state && !locale) return '*';
    let output = variant;
    if (state || locale) {
        output += SEP + (state || '*');
        if (locale) {
            output += SEP + (locale || '*');
        }
    } else {
        output += SEP + '*';
    }
    return output;
};

module.exports.set = (root, path, value, variant, state, locale) => {
    if (!path) {
        throw new Error('Path is requried in setter');
    }
    let input = {},
        old = crawl(root, path),
        target = module.exports.pattern(variant, state, locale),
        notVariant = (typeof old === 'string') || !old.type || (old.type && old.type !== 'Variants');

    if (notVariant && target === '*') {
        input = value;
    } else {
        if (notVariant) {
            if(typeof old === 'object' && old.hasOwnProperty('*')) {
                input = old;
            } else {
                input['*'] = old;
            }
            input.type = 'Variants';
        } else {
            input = old;
        }
        input[target] = value;

    }
    crawl(root, path, input);

};

function crawl(object, path, value) {

    let elems = path ? path.split('.') : [],
        field = elems.shift();

    if (value && object && (field !== undefined && field !== null)) {
        if (elems.length > 0) {
            object[field] = object[field] || {};
        } else {
            object[field] = value;
        }
    }

    if (!path || !path.length || !object) return object;

    return crawl(object[field], elems.join('.'), value);
}

module.exports.get = (root, path, variant, state, locale) => {
    return parse(crawl(root, path), variant, state, locale);
};
