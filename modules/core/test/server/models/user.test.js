/* jslint node:true, esnext:true, mocha:true */
/* globals LACKEY_PATH */
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
    dbsInit = require('../../../../../test/mockup/dbs'),
    should = require('should'),
    Generator = require(LACKEY_PATH).generator,
    SUtils = require(LACKEY_PATH).utils;

describe('modules/core/server/models/user', () => {

    let UserModel,
        UserGenerator,
        EMAIL = 'test2@example.com',
        savedUser,
        lock = false;

    before((done) => {
        dbsInit(() => {
            require('../../../server/models/user')
                .then((user) => {
                    UserModel = user;
                    UserGenerator = require('../../../server/models/user/generator');
                    return UserModel.removeAll();
                })
                .then(() => {
                    done();
                });
        });
    });



    describe('Post mongo times', () => {

        let user, user2, user3, oauthUserData;

        before((done) => {

            dbsInit(() => {

                user = new UserModel({
                    name: 'Full Name',
                    email: 'test@test.com',
                    username: 'username',
                    password: 'password'
                });
                user2 = new UserModel({
                    name: 'Full Name 2',
                    email: 'test@test.com',
                    username: 'username',
                    password: 'password',
                    confirmed: true
                });
                user3 = new UserModel({
                    name: 'Full Name 3'
                });
                done();
            });
        });

        it('should begin with no users', () => {
            return UserModel.removeAll()
                .then(() => {
                    return UserModel.count();
                })
                .then((count) => {
                    count.should.be.eql(0);
                    return true;
                })
                .should.finally.be.eql(true);
        });



        it('should be able to save without problems', function () {
            return user
                .save()
                .then((user) => {
                    return user.getIdentity(UserModel.EMAIL);
                })
                .then((email) => {
                    email.accountId.should.be.eql('test@test.com');
                    return user.getIdentity(UserModel.USERNAME);
                })
                .then((username) => {
                    username.accountId.should.be.eql('username');
                    return true;
                }).should.finally.be.eql(true);
        });

        it('should fail to save an existing user again', function () {
            return user2.save().should.be.rejected();
        });

        it('Should fail to save user with missing credentials', function () {
            return user3.save().should.be.rejected();
        });

        it('should allow to add oauth account to existing user', function (done) {
            this.timeout(5000);
            UserModel.oAuthHandle(user, 'facebook', '1234567890', 'abcdefghijkl', 'abcdefghijkl9', {}, {}, (err, newUser) => {
                try {
                    should.not.exist(err);
                    should.exist(newUser);
                    UserModel.oAuthHandle(null, 'facebook', '1234567890', 'zzzzzzzzzz', 'ddddddddd', {}, {}, (err, newestUser) => {
                        should.not.exist(err);
                        user = newestUser;
                        done();
                    });
                } catch (error) {
                    /* istanbul ignore next */
                    done(error);
                }
            });
        });

        it('should allow to add oauth account to existing user 2', function (done) {
            this.timeout(5000);
            UserModel.oAuthHandle(user, 'facebook', '123446777', 'abcdefghijkl', 'abcdefghijkl9', {}, {}, (err, newUser) => {
                should.not.exist(err);
                should.exist(newUser);
                done();
            });
        });

        it('should allow to create other user with different oauth id', function (done) {
            UserModel.oAuthHandle(null, 'facebook', '0987654321', 'abcdefghijkl', 'abcdefghijkl9', {}, {
                name: 'my name'
            }, function (error, newUser) {
                if (error) {
                    /* istanbul ignore next */
                    return done(error);
                }
                oauthUserData = newUser;
                should(oauthUserData.id).not.eql(user.id);
                done();
            });

        });

        it('should verify which user has confirmed identity', function () {
            return user
                .isIdentityConfirmed(UserModel.EMAIL)
                .should.finally.be.eql(false)
                .then(() => {
                    return user2.isIdentityConfirmed(UserModel.EMAIL);
                })
                .should.finally.be.eql(false)
                .then(() => {
                    return user.setIdentityConfirmed(UserModel.EMAIL, null, true);
                })
                .then(() => {
                    return user.isIdentityConfirmed(UserModel.EMAIL);
                }).should.finally.be.eql(true);
        });


        it('should allow to update provider data and token', function (done) {
            UserModel.oAuthHandle(user, 'facebook', '1234567890', '13579', 'abcdefghijkl9', {
                someData: 222
            }, {}, function (error, newUser) {
                newUser.getIdentity('facebook', '1234567890')
                    .then((fbdata) => {
                        should(fbdata.accessToken).eql('13579');
                        should(fbdata.providerData.someData).eql(222);
                        done();
                    });
            });
        });

        it('shouldn\'t allow to use one provider/id for two users', function (done) {
            UserModel.oAuthHandle(user, 'facebook', '0987654321', 'abcdefghijkl', 'abcdefghijkl9', {}, {}, function (error) {
                should.exist(error);
                done();
            });
        });

        it('should authenticate user', () => {
            user.authenticate('password').should.be.True;
        });

        it('Should find by mixed provider work', function () {
            return UserModel
                .getByProvider([UserModel.EMAIL, UserModel.USERNAME], 'test@test.com')
                .then((user) => {
                    should.exist(user);
                    return true;
                }).should.finally.be.eql(true);
        });

        it('Should remove facebook identity', function () {
            return user
                .getIdentity('facebook', '1234567890')
                .then((identity) => {
                    should.exist(identity);
                    return user.getIdentity('facebook', '123446777');
                })
                .then((identity) => {
                    should.exist(identity);
                    return user.removeOtherIdentity('facebook', '1234567890');
                })
                .then(() => {
                    return user.getIdentity('facebook', '1234567890');
                })
                .then((identity) => {
                    should.exist(identity);
                    return user.getIdentity('facebook', '123446777');
                })
                .then((identity) => {
                    should.not.exist(identity);
                    return user.removeIdentity('facebook', '1234567890');
                })
                .then(() => {
                    return user.getIdentity('facebook', '1234567890');
                })
                .then((identity) => {
                    should.not.exist(identity);
                    return user.getIdentity('facebook', '123446777');
                })
                .then((identity) => {
                    should.not.exist(identity);
                    return true;
                }).should.finally.be.eql(true);
        });

        it('Should generate unique names', function () {
            return UserModel.findUniqueUsername('username', null)
                .then((name) => {
                    name.should.be.eql('username1');
                    return UserModel.findUniqueUsername('username', 'abc');
                }).then((name) => {
                    name.should.be.eql('usernameabc');
                }).should.finally.be.fullfilled;
        });


    });


    it('Test user doesn\'t exists', () => {
        return UserModel.exists(EMAIL).should.finally.be.False;
    });

    it('Creates user', () => {
        return SUtils.serialPromise([
            null,
            {},
            {
                name: 'name'
                },
            {
                email: 'email'
                },
            {
                password: 'password'
                },
            {
                name: 'name',
                email: 'email'
                },
            {
                name: 'name',
                password: 'password'
                },
            {
                email: 'name',
                password: 'password'
                }
        ], (input) => {
            return UserModel.create(input).should.be.rejected();
        }).then(() => {
            return UserModel.create({
                name: 'name',
                email: EMAIL,
                password: 'password'
            });
        }).then((user) => {
            savedUser = user;
            return user;
        }, (error) => {
            console.error(error);
            console.error(error.stack);
        }).should.be.fulfilled();
    });

    it('Gets user by ID', () => {
        return Promise.all([
                UserModel.findById(null).should.finally.be.Null,
                UserModel.findById('ABC').should.finally.be.Null,
                UserModel.findById(savedUser.id).then((user) => {
                user.id.should.be.eql(savedUser.id);
                return user;
            }).should.be.fulfilled()
        ]);
    });

    it('Gets user by provider', () => {
        let foundUser;
        return Promise.all([
            UserModel.getByProvider(UserModel.EMAIL).should.finally.be.Null,
            UserModel.getByProvider(UserModel.EMAIL, 'ABC').should.finally.be.Null,
            UserModel.getByProvider(UserModel.EMAIL, EMAIL).then((user) => {
                user.id.should.be.eql(savedUser.id);
                foundUser = user;
                return user.getRoles();
            }).then((result) => {
                result.should.be.eql([]);
            }).then(() => {
                return foundUser.toJSON();
            }).then((result) => {
                should.exist(result);
                result.name.should.be.eql('name');
                result.roles.should.be.eql([]);
                result.image.source.should.be.eql('https://s.gravatar.com/avatar/43b05f394d5611c54a1a9e8e20baee21?s=250&r=x&d=retro');
            }).then(() => {
                return true;
            }).should.be.finally.eql(true)]);
    });

    it('Removes user', () => {
        savedUser.name.should.not.be.eql('Deleted user ' + savedUser.id);
        return savedUser
            .remove()
            .then(() => {
                return UserModel
                    .exists(EMAIL);
            })
            .then(exists => {
                should(exists).be.False;
                return UserModel.getByProvider(UserModel.EMAIL, EMAIL);
            })
            .then((user) => {
                should.not.exist(user);
                return UserModel.findById(savedUser.id);
            })
            .then((user) => {
                user.id.should.be.eql(savedUser.id);
                user._doc.deleted.should.be.True;
                user.name.should.be.eql('Deleted user ' + user.id);
            })
            .then(() => true)
            .should.be.finally.eql(true);
    });

    it('Runs query', () => {
        return UserModel
            .table()
            .then(table => {
                table.data.length.should.be.eql(0);
                return UserModel.count();
            })
            .should.be.finally.eql(1);
    });

    it('Loads init data', () => {
        Generator.registerMapper('User', UserGenerator);
        return Generator
            .load(__dirname + '/../../../module.yml', true)
            .then(() => {
                return UserModel
                    .exists('test@example.com');
            })
            .then((result) => {
                result.should.be.True;
                return UserModel
                    ._preQuery({}, {
                        textSearch: 'łąki'
                    })
                    .then(query => UserModel.count(query));
            })
            .then(result => {
                result.should.be.eql(1);
                return UserModel
                    ._preQuery({}, {
                        textSearch: 'ŁĄKI'
                    })
                    .then(query => UserModel.count(query));
            })
            .then(result => {
                result.should.be.eql(1);
                lock = true;
                return true;
            })
            .should.finally.be.eql(true);
    });

    it('Should finish previous test first', () => {
        lock.should.be.eql(true);
    });

});
