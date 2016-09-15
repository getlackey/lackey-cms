/* jslint node:true, esnext:true, browser:true */
'use strict';

const
    lackey = require('core/client/js'),
    Stack = require('cms/client/js/manager/stack'),
    stack = new Stack(),
    api = require('core/client/js/api');

lackey.bind('[data-lky-hook="action:pick-taxonomy"]', 'click', (event, hook) => {
    let
        type = hook.getAttribute('data-type'),
        userId = hook.getAttribute('data-profile');

    stack
        .pickTaxonomy(type)
        .then(response => {
            if (response) {
                return api
                    .create('/cms/user/' + userId + '/taxonomy', JSON.parse(response))
                    .then(() => document.location.reload(true));
            }
            return null;
        });
});

lackey.bind('[data-lky-hook="action:pick-role"]', 'click', (event, hook) => {
    let
        userId = hook.getAttribute('data-profile');

    stack
        .pickRole()
        .then(response => {
            if (response) {
                return api
                    .create('/cms/user/' + userId + '/role/' + JSON.parse(response).name, {})
                    .then(() => document.location.reload(true));
            }
            return null;
        });
});

lackey.bind('[data-lky-hook="action:remove-taxonomy"]', 'click', (event, hook) => {
    let
        type = hook.getAttribute('data-type'),
        name = hook.getAttribute('data-taxonomy'),
        userId = hook.getAttribute('data-profile');

    return api
        .delete('/cms/user/' + userId + '/taxonomy/' + type + '/' + name)
        .then(() => document.location.reload(true));
});

lackey.bind('[data-lky-hook="action:remove-role"]', 'click', (event, hook) => {
    let
        name = hook.getAttribute('data-role'),
        userId = hook.getAttribute('data-profile');

    return api
        .delete('/cms/user/' + userId + '/role/' + name)
        .then(() => document.location.reload(true));
});

lackey.bind('#username', 'submit', (event, hook) => {
    event.stopPropagation();
    event.preventDefault();

    let data = lackey.form(hook);

    return api
        .update('/cms/user/' + data.id + '/name', {
            name: data.name
        })
        .then(() => document.location.reload(true));
});
