'use strict';

const SUtils = require(LACKEY_PATH).utils;

module.exports = SUtils.deps(
        SUtils.cmsMod('users').model('role'),
        SUtils.cmsMod('users').model('user'),
        SUtils.cmsMod('cms').model('taxonomy-type'),
        SUtils.cmsMod('cms').model('taxonomy'),
        SUtils.cmsMod('cms').model('template'),
        SUtils.cmsMod('media').model('media'),
        SUtils.cmsMod('cms').model('content')
    )
    .promised((Role, User, TaxonomyType, Taxonomy, Template, Media, Content) => {

        class Serializer {
            static all() {
                let result = {};
                return Promise.all([
                    Serializer.roles().then((roles) => {
                            result.Role = roles;
                        }),
                    Serializer.users().then((users) => {
                            result.User = users;
                        }),
                    Serializer.taxonomyTypes().then((taxonomyTypes) => {
                            result.TaxonomyType = taxonomyTypes;
                        }),
                    Serializer.taxonomy().then((taxonomy) => {
                            result.Taxonomy = taxonomy;
                        }),
                    Serializer.templates().then((template) => {
                            result.Template = template;
                        }),
                    Serializer.medias().then((medias) => {
                            result.Media = medias;
                        }),
                    Serializer.contents().then((content) => {
                            result.Content = content;
                        })
                ])
                    .then(() => result);
            }
            static roles() {
                return Role.find()
                    .then((roles) => {
                        return roles.map((role) => {
                            return {
                                name: role.name,
                                label: role.label,
                                acl: role.acl
                            };
                        });
                    });
            }
            static users() {
                return User.find()
                    .then((users) => {
                        return Promise.all(users.map((user) => {
                            return user.getIdentities('email')
                                .then((identities) => {
                                    return {
                                        name: user.name,
                                        roles: user.roles.map((role) => role.name),
                                        image: user.image ? user.image.source : null,
                                        email: identities[0] ? identities[0].accountId : null
                                    };
                                });
                        }));
                    });
            }
            static taxonomyTypes() {
                return TaxonomyType.find()
                    .then((types) => types.map((type) => {
                        return {
                            name: type.name,
                            label: type.label
                        };
                    }));
            }
            static taxonomy() {
                return Taxonomy.find()
                    .then((taxonomies) => taxonomies.map((taxonomy) => {
                        return {
                            name: taxonomy.name,
                            label: taxonomy.label,
                            type: taxonomy.type.name
                        };
                    }));
            }
            static templates() {
                return Template.find()
                    .then((templates) => templates.map((template) => {
                        return {
                            name: template.name,
                            path: template.path,
                            thumb: template.thumb,
                            selectable: template.selectable,
                            props: template.props || {},
                            type: template.type
                        };
                    }));
            }
            static medias() {
                return Media.find()
                    .then((medias) => medias.map((media) => {
                        return {
                            name: media.name,
                            source: media.source,
                            attributes: media.attributes
                        };
                    }));
            }
            static contents() {
                return Content
                    .find()
                    .then((contents) => Promise.all(contents.map((content) => {
                        let promise;
                        if (content.layout) {
                            promise = Content.serializer.serialize(content.toJSON());
                        } else {
                            promise = Promise.resolve({});
                        }

                        return promise.then((output) => {
                            return {
                                type: content.type,
                                route: content.route,
                                props: content.props || {},
                                template: content.template ? content.template.path : '',
                                taxonomies: content.taxonomies ? content.taxonomies.map((taxonomy) => {
                                    return {
                                        name: taxonomy.name,
                                        type: taxonomy.type.name
                                    };
                                }) : [],
                                layout: output.layout
                            };
                        }, (error) => {
                            console.error(error);
                        });
                    })));
            }

        }

        return Serializer;

    });
