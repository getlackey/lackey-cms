/* eslint no-cond-assign:0, no-new:0 */
/* jslint browser:true, node:true, esnext:true */
'use strict';

const lackey = require('core/client/js'),
    treeParser = require('cms/shared/treeparser'),
    api = require('core/client/js/api');

let picker = lackey.select('[data-lky-author-picker]')[0],
    toUpdate = lackey.select('[data-lky-author]'),
    users = {},
    defContent;
picker = null; //TODO
if (picker) {
    top.Lackey.manager.getDefault()
        .then((def) => {
            defContent = def;
            return api
                .read('/cms/user?limit=100');
        })
        .then((list) => {
            list.data.forEach((user) => {
                let option = document.createElement('option');
                option.value = user.id;
                users[user.id] = user;
                option.innerText = user.name;
                if (defContent.author && user.id === defContent.author.id) {
                    option.selected = true;
                }
                picker.appendChild(option);
            });
            picker.addEventListener('change', () => {
                let newUser = users[picker.value];
                toUpdate.forEach((element) => {
                    let rule = element.getAttribute('data-lky-author').split(':');
                    element[rule[0]] = treeParser.crawl(newUser, rule[1]);
                });
                top.Lackey.manager.setAuthor(defContent.id, newUser);
            });
        });
}
