/* jslint node:true, esnext:true */
/* globals LACKEY_PATH */
'use strict';

const
    Model = require('objection').Model,
    SCli = require(LACKEY_PATH).cli,
    MuleInTheDust = require('muleinthedust');


module.exports = () => {

    class ContentModel extends Model {
        static get tableName() {
            return 'content';
        }
    }

    console.log('upgrading');

    return SCli
        .sql(ContentModel
            .query()
            .select('id', 'layout')
        )
        .then(list => {
            return Promise
                .all(list
                    .map(page => {
                        //console.log('upgrading', page.id);
                        if(page && page.layout && page.layout._type) {
                            return;
                        }
                        return SCli
                            .sql(
                                ContentModel
                                .query()
                                .patch({
                                    layout: MuleInTheDust.migrate.migrateNode(page.layout)
                                })
                                .where('id', page.id)
                            );
                    }));
        })
        .catch(error => console.error(error));
};
