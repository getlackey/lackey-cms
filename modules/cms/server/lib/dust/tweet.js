/* jslint node:true, esnext:true */
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
if (!GLOBAL.LACKEY_PATH) {
  /* istanbul ignore next */
  GLOBAL.LACKEY_PATH = process.env.LACKEY_PATH || __dirname + '/../../../../../lib';
}

const SCli = require(LACKEY_PATH).cli,
  configuration = require(LACKEY_PATH).configuration(),
  Twitter = require('twitter');

let lastResults = {},
  throttle = 1000 * 60 * 15,
  twitter = configuration.then((config) => {
    let conf = config.get('twitter');

    if (!conf) {
      return;
    }

    return new Twitter({
      consumer_key: conf.apiKey,
      consumer_secret: conf.secret,
      access_token_key: conf.token,
      access_token_secret: conf.accessSecret
    });
  });

module.exports = (dust) => {

  dust.helpers.tweet = function (chunk, context, bodies, params) {

    let
      data = context,
      account = params.account + '',
      limit = params.limit || 1,
      input = {
        screen_name: account,
        count: limit
      };

    SCli.debug('lackey-cms/modules/cms/serer/lib/dust/tweet', account, limit);

    if (lastResults[account] && lastResults[account].ts + throttle >= (new Date()).getTime()) {

      data = context.push({
        tweets: lastResults[account].tweets
      });
      chunk.render(bodies.block, data);
      return chunk;
    }


    return chunk.map((injectedChunk) => {
      return twitter.then((client) => {

        client.get('statuses/user_timeline', input, (err, tweets) => {

          if (!err) {
            lastResults[account] = {
              ts: (new Date().getTime()),
              tweets: tweets
            };
            data = context.push({
              tweets: tweets
            });
            injectedChunk.render(bodies.block, data);
          }
          injectedChunk.end();
          return injectedChunk;
        });

      });
    });

  };

};
