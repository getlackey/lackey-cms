/*jslint node:true, unparam:true, regexp:true, esnext:true  */
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
const falcorExpress = require('falcor-express'),
  Router = require('falcor-router');

let LackeyRouter;

module.exports = (server) => {
  /* istanbul ignore next : external */
  let handler = (req) => {
    /* istanbul ignore next : external */
    return new LackeyRouter(req.user);
  };
  server.decorateMiddleware(['/model.json', falcorExpress.dataSourceRoute(handler)], 'falcor');

  return function (routes) {
    let RouterBase = Router.createClass(routes);
    LackeyRouter = function (user) {
      RouterBase.call(this);
      this.user = user;
    };
    LackeyRouter.prototype = Object.create(RouterBase.prototype);
    return LackeyRouter;
  };
};
