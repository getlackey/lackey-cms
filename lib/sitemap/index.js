/* jslint esnext:true, node:true */
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

/**
 * @module lackey-cms/sitemap
 */

let cache = [],
    sources = [];

module.exports = {
    flush: () => {
        sources = [];
    },
    addSource: source => sources.push(source),
    refresh: () => {
        return Promise
            .all(sources.map(source => source()))
            .then(results => {
                let merged = [];
                results
                    .forEach(result => {
                        merged = merged.concat(result);
                        return merged;
                    });
                cache = merged;
                return merged;
            });
    },
    getCached: () => {
        return cache;
    }
};
