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
 * @module lackey-cms
 * @description Lackey CMS
 */
module.exports = {
 /**
  * @link lackey-cms/utils
  */
 utils: require('./utils'),
 /**
  * @link lackey-cms/utils/cli
  */
 cli: require('./utils/cli'),
 /**
  * @link lackey-cms/server
  */
 server: require('./server'),
 /**
  * @link lackey-cms/datasources
  */
 datasources: require('./datasources'),
 /**
  * @link lackey-cms/configuration
  */
 configuration: require('./configuration'),
 /**
  * @link lackey-cms/utils/uploads
  */
 uploads: require('./utils/uploads'),
 /**
  * @link lackey-cms/sitemap
  */
 sitemap: require('./sitemap'),
 /**
  * @link lackey-cms/generator
  */
 generator: require('./generator'),
 /**
  * @link lackey-cms/mailer
  */
 mailer: require('./mailer')
};
