/* jslint node:true, esnext:true, es6:true, browser:true */
/* eslint default-case:0 no-alert:0 */
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
    growl = require('cms/client/js/growl'),
    api = require('core/client/js/api');


lackey.bind('[data-lky-api]', 'click', (event, hook) => {
    let apiAction = hook.getAttribute('data-lky-api').split(':');

    switch (apiAction[0]) {
    case 'DELETE':
        {
            if (confirm('Are you sure? This action cannot be undone.')) {
                api
                    .delete(apiAction[1])
                    .then(() => {
                        growl({
                            status: 'success',
                            message: 'Deleted'
                        });
                        setTimeout(function () {
                            //document.location.href = 'cms/user/';
                            window.location.reload();
                        }, 2000);

                    }, error => {
                        growl({
                            status: 'error',
                            message: error.message || error.toString()
                        });
                    });
            }
        }
    }
});
