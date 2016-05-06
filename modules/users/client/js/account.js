/* eslint no-cond-assign:0, no-alert:0 */
/* jslint browser:true, node:true, esnext:true */
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
const lackey = require('../../../core/client/js'),
    api = require('../../../cms/client/js/api'),
    Media = require('../../../cms/client/js/media'),
    modal = require('../../../core/client/js/modal'),
    MediaModalController = require('../../../cms/client/js/manager/media');

lackey.select('[data-lky-media]').forEach((element) => {
    let media = new Media(element);
    media.selected((mediaObject) => {
        return modal
            .open('cms/cms/image', {
                node: mediaObject.node,
                media: mediaObject.media
            }, MediaModalController)
            .then((result) => {
                if (!result && result !== -1) {
                    return;
                }
                mediaObject.set(result !== -1 ? result : null);
                api.update('/me', {
                    avatar: result !== -1 ? result.id : null
                });
            });
    });
});

lackey.bind('lky:confirm-email', 'click', (event, hook) => {
    event.preventDefault();
    event.cancelBubble = true;

    api.create('/account/confirm-email', {
        email: hook.getAttribute('data-lky-email')
    });
    return false;
});

function validPass(pass) { // TODO: move to backend
    if (!pass || pass.length < 6) return false;
    if (!pass.match(/\d+/g)) return false;
    if (!pass.match(/[a-zA-Z]+/g)) return false;
    if (!pass.match(/[^a-zA-Z0-9\d\s]/g)) return false;
    return true;
}

lackey.bind('lky:password', 'submit', (event, hook) => {
    event.preventDefault();
    event.cancelBubble = true;
    let data = lackey.form(hook);
    if (data.newPassword !== data.newPassword2) {
        alert('Passwords doesn\'t match');
        return false;
    }
    if (!validPass(data.newPassword)) {
        alert('Password has to be minimum 6 characters long, contain at least one letter, one digit and one special character');
        return false;
    }
    api.create('/account/password', {
        password: data.newPassword
    });
    return false;
});
