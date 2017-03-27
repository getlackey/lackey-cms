/* jslint node:true, esnext:true, browser:true */
'use strict';

const
    lackey = require('core/client/js'),
    Stack = require('cms/client/js/manager/stack'),
    stack = new Stack(),
    api = require('core/client/js/api'),
    growl = require('cms/client/js/growl');

module.exports = function (el, cb) {
    var root = el || document,
        callback = cb || function () {};

    lackey.bind('[data-lky-hook="action:pick-taxonomy"]', 'click', (event, hook) => {
        let
            type = hook.getAttribute('data-type'),
            addable = hook.getAttribute('data-addable'),
            userId = hook.getAttribute('data-profile');

        stack
            .pickTaxonomy(type, addable)
            .then(response => {
                if (response) {
                    return api
                        .create('/cms/user/' + userId + '/taxonomy', JSON.parse(response))
                        .then(() => {
                            growl({
                                status: 'success',
                                message: 'Added'
                            });
                            callback();
                        });
                }
                return null;
            });
    }, root);

    lackey.bind('[data-lky-hook="action:pick-role"]', 'click', (event, hook) => {
        let
            userId = hook.getAttribute('data-profile');

        stack
            .pickRole()
            .then(response => {
                if (response) {
                    return api
                        .create('/cms/user/' + userId + '/role/' + JSON.parse(response).name, {})
                        .then(() => {
                            growl({
                                status: 'success',
                                message: 'Added'
                            });
                            callback();
                        }, error => {
                            growl({
                                status: 'error',
                                message: 'Forbidden'
                            });
                        });
                }
                return null;
            });
    }, root);

    lackey.bind('[data-lky-hook="action:remove-taxonomy"]', 'click', (event, hook) => {
        let
            type = hook.getAttribute('data-type'),
            name = hook.getAttribute('data-taxonomy'),
            userId = hook.getAttribute('data-profile');

        return api
            .delete('/cms/user/' + userId + '/taxonomy/' + type + '/' + name)
            .then(() => {
                growl({
                    status: 'success',
                    message: 'Removed'
                });
                callback();
            });
    }, root);

    lackey.bind('[data-lky-hook="action:remove-role"]', 'click', (event, hook) => {
        let
            name = hook.getAttribute('data-role'),
            userId = hook.getAttribute('data-profile');

        return api
            .delete('/cms/user/' + userId + '/role/' + name)
            .then(() => {
                growl({
                    status: 'success',
                    message: 'Removed'
                });
                callback();
            }, error => {
                growl({
                    status: 'error',
                    message: 'Forbidden'
                });
            });
    }, root);

    lackey.bind('#username', 'submit', (event, hook) => {
        event.stopPropagation();
        event.preventDefault();

        let data = lackey.form(hook);

        return api
            .update('/cms/user/' + data.id + '/name', {
                name: data.name
            })
            .then(() => {
                growl({
                    status: 'success',
                    message: 'Updated'
                });
                callback();
            });
    }, root);
};
