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
const
    lackey = require('core/client/js'),
    api = require('core/client/js/api'),
    growl = require('cms/client/js/growl'),
    Media = require('cms/client/js/media'),
    userDrop = require('cms/client/js/manager/user.dropdown.js'),
    Upload = require('core/client/js/upload');


var media,
    dragdrop,
    userHead = lackey.select('[data-lky-hook="header.user"]')[0];

userDrop();

function updateHead(name, src) {
    if (name) {
        userHead.querySelector('span').innerHTML = name;
    }
    if (src) {
        userHead.querySelector('figure img').src = src;
    }
}

lackey
    .select('[data-lky-media]').forEach((element) => {
        media = new Media(element);
        let src = media.node.getAttribute('src');
        if (!src) {
            media.node.setAttribute('src', 'img/cms/cms/svg/ui/account.svg');
        }

        media.input.addEventListener('change', function (event) {
            media.upload.choice(event);
        });

        document.querySelector('#fileIn').addEventListener('click', function () {
            media.input.click();
        });

        media.upload.on('done', function (uploader, data) {
            if (data && data.length && data[0].data) {
                media.set(data[0].data);
                media.notify();
                api.update('/me', {avatar: media.media.id}).then(() => {
                    growl({
                        status: 'success',
                        message: 'Profile photo successfully updated'
                    });
                    updateHead(null, media.node.src);
                });
            }
        });
    });

dragdrop = new Upload(document.querySelector('#imageDrop'));
dragdrop.on('done', function (uploader, data) {
      if (data && data.length && data[0].data) {
            media.set(data[0].data);
            media.notify();
            api.update('/me', {avatar: media.media.id}).then(() => {
                growl({
                    status: 'success',
                    message: 'Profile photo successfully updated'
                });
                updateHead(null, media.node.src);
            });
      }
});
window.dragdrop = dragdrop;

lackey.bind('lky:basic-info', 'submit', (event, hook) => {
    event.preventDefault();
    event.cancelBubble = true;

    let data = lackey.form(hook),
        update = {};

    if (data.name) {
        update.name = data.name;
    }

    api.update('/me', update).then(() => {
        growl({
            status: 'success',
            message: 'Basic info successfully updated'
        });
        updateHead(data.name);
    });
    return false;
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

lackey.bind('.sess-rm', 'click', (event, hook) => {
    event.preventDefault();

    api.delete('/cms/session/' + hook.getAttribute('data-id'))
        .then(() => {
            hook.parentNode.parentNode.removeChild(hook.parentNode);
        }, (error) => {
            console.error(error);
        });
});

lackey.bind('.sess-rmCurrent', 'click', (event) => {
    event.preventDefault();
    window.location = '/logout';
});

lackey.bind('.sess-rmAll', 'click', (event) => {
    event.preventDefault();

    api.delete('/cms/session')
        .then(() => {
            var items = document.querySelectorAll('.active-sessions .session'),
                i;
            for (i = 0; i < items.length; i += 1) {
                if (!items[i].classList.contains('current')) {
                    items[i].parentNode.removeChild(items[i]);
                }
            }
        }, (error) => {
            console.error(error);
        });
});

lackey.bind('lky:password', 'submit', (event, hook) => {
    event.preventDefault();
    event.cancelBubble = true;
    let data = lackey.form(hook);
    if (data.newPassword !== data.newPassword2 && data.newPassword2 !== undefined) {
        growl({
            status: 'error',
            message: 'Passwords don\'t match'
        });
        return false;
    }
    if (!validPass(data.newPassword)) {
        growl({
            status: 'error',
            message: 'Password has to be minimum 6 characters long, contain at least one letter, one digit and one special character'
        });
        return false;
    }
    api.create('/account/password', {
        password: data.newPassword
    }).then(() => {
        growl({
            status: 'success',
            message: 'Password changed successfully'
        });
    });
    return false;
});
