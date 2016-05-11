/* eslint no-cond-assign:0, no-new:0, no-alert:0 */
/* jslint browser:true, node:true, esnext:true */
'use strict';

const lackey = require('core/client/js');

let defContent;

top.Lackey.manager.current
    .then((def) => {
        return top.Lackey.manager.repository.get('content', def.id);
    })
    .then((def) => {
        defContent = def;
        lackey.select('[data-lky-related]').forEach((item) => {
            let index = item.getAttribute('data-lky-related');
            item.addEventListener('click', () => {
                top.Lackey.manager.setRelated(defContent.id, prompt('Please specify path', defContent.layout.related ? defContent.layout.related[index] : ''), index);
            });
        });
    });
