/*jslint node: true */
'use strict';

/**
 * @param {DustEngine} dust
 */
module.exports = (dust) => {
    dust.filters.acronym = function (value) {
        return value.match(/\b([A-Za-z])/g).join('').toUpperCase();
    };
};
