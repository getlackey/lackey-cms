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

const should = require('should'),
    middleware = require('../../../../lib/server/init/api');

describe('lib/server/init/api', () => {
    it('String', (callback) => {
        middleware({
            use: (middleware) => {
                let req = {},
                    res = {
                        _header: {},
                        header: (type, value) => {
                            res._header[type] = value;
                        },
                        send: (data) => {
                            res._header['Content-Type'].should.be.eql('application/json');
                            data.should.be.eql('text');
                            callback();
                        }
                    },
                    next = () => {
                        res.api('text');
                    };

                middleware(req, res, next);
            }
        });
    });

    it('Object', (callback) => {
        middleware({
            use: (middleware) => {
                let req = {},
                    res = {
                        _header: {},
                        header: (type, value) => {
                            res._header[type] = value;
                        },
                        send: (data) => {
                            res._header['Content-Type'].should.be.eql('application/json');
                            data.should.be.eql({
                                dummy: 1
                            });
                            callback();
                        }
                    },
                    next = () => {
                        res.api({
                            toJSON: () => {
                                return {
                                    dummy: 1
                                }
                            }
                        });
                    };

                middleware(req, res, next);
            }
        });
    });

    it('Array', (callback) => {
        middleware({
            use: (middleware) => {
                let req = {},
                    res = {
                        _header: {},
                        header: (type, value) => {
                            res._header[type] = value;
                        },
                        send: (data) => {
                            res._header['Content-Type'].should.be.eql('application/json');
                            data.should.be.eql([{
                                dummy: 1
                            }, 'text', 1, true, {
                                sth: 1
                            }]);
                            callback();
                        }
                    },
                    next = () => {
                        res.api([{
                            toJSON: () => {
                                return {
                                    dummy: 1
                                }
                            }
                        }, 'text', 1, true, {
                            sth: 1
                        }]);
                    };

                middleware(req, res, next);
            }
        });
    });
});
