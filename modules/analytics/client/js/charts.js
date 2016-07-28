/* jslint esnext:true, node:true, browser:true */
/*eslint no-new:0*/
'use strict';
/**
    The MIT License (MIT)

    Copyright (c) 2016 Łukasz Marek Sielski

    This file is copied from http://github.com/sielay/skaryna

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/
var
  Chartist = require('chartist/dist/chartist.min.js'),
  lackey = require('core/client/js'),
  xhr = require('core/client/js/xhr');
lackey
  .select('[data-lky-chart]')
  .forEach(hook => {
    let apiPath = hook.getAttribute('data-lky-chart');

    xhr
      .get(apiPath)
      .then(data => JSON.parse(data))
      .then(data => data.data.table.rows.map(row => {
        return {
          value: +row.columns[1].value,
          name: row.columns[0].value,
          meta: row.columns[0].value
        };
      }))
      .then(series => {

        let rest = 0,
          sers = [],
          labels = [];
        while (series.length > 5) {
          rest += series.pop().value;
        }
        if (rest > 0) {
          series.push({
            value: rest,
            name: 'other',
            meta: 'other'
          });
        }

        series.forEach(serie => {
          labels.push(serie.name);
          sers.push(serie.value);
        });

        new Chartist.Pie(hook, {
          labels: labels,
          series: sers
        });
      });
  });
