/*jslint node:true, nomen:true, unparam:true, esnext:true */
/* globals LACKEY_PATH */
'use strict';

/*
    Copyright 2015 Enigma Marketing Services Limited

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

const nodemailer = require('nodemailer'),
    dust = require('dustjs-linkedin'),
    views = require('../server/init/views'),
    SUtils = require('../utils'),
    SCli = require('../utils/cli'),
    __MODULE_NAME = 'lackey-cms/lib/mailer';

let transport,
    lookup;

function getTemplate(path) {

    SCli.debug(__MODULE_NAME, 'getTemplate', path);

    return lookup(path, {})
        .then((templatePath) => {
            return SUtils.read(templatePath);
        });
}

function render(template, vars) {
    SCli.debug(__MODULE_NAME, 'render', template);
    return new Promise((resolve, reject) => {
        dust.renderSource(template, vars, (err, html) => {
            if (err) {
                return reject(err);
            }
            resolve(html);
        });
    });
}

function send(from, to, subject, text, html) {
    SCli.debug(__MODULE_NAME, 'send', from, to, subject);
    return new Promise((resolve, reject) => {
        transport.sendMail({
            from: from,
            to: to,
            subject: subject,
            html: html,
            text: text
        }, (err, info) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            resolve(info);
        });
    });
}

/**
 * @param   {object}   options
 * @param   {string}   options.template
 * @param   {string}   options.from
 * @param   {string}   options.to
 * @param   {string}   options.subject
 */
function mailer(options) {
    return getTemplate(options.template)
        .then((template) => {
            return render(template, options);
        })
        .then((html) => {
            return send(options.from, options.to, options.subject, html, html);
        });
}

module.exports = (options) => {
    return require('../configuration')()
        .then((config) => {
            if (!transport) {
                SCli.debug(__MODULE_NAME, 'createTransport', config.get('mailer.type'));
                try {
                    let lib = require(config.get('mailer.type'));
                    transport = nodemailer.createTransport(lib(config.get('mailer.config')));
                } catch (err) {
                    SCli.error(err);
                    throw err;
                }
            }

            let _lookup = views.lookup(LACKEY_PATH + '/', SUtils.getProjectPath());

            lookup = (path, cfg) => {
                return new Promise((resolve, reject) => {
                    _lookup(path, cfg, (err, templatePath) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(templatePath);
                    });
                });
            };

            if (options) {
                options.from = options.from || config.get('mailer.from');
                options.host = options.host || config.get('host');
                return mailer(options);
            }
            return mailer;
        });
};
