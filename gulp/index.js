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

const sass = require('gulp-sass'),
    path = require('path'),
    rename = require('gulp-rename'),
    del = require('del'),
    browserify = require('gulp-browserify'),
    nodemon = require('gulp-nodemon'),
    autoprefixer = require('gulp-autoprefixer'),
    dust = require('gulp-dust-2.7'),
    plumber = require('gulp-plumber');

module.exports = (gulp, projectDIR) => {

    let lackeyDIR = path.resolve(__dirname + '/..'),
        htDocs = projectDIR + '/htdocs';

    gulp.task('lackey.all', [
        'lackey.cleanup',
        'lackey.resources',
        'lackey.server',
        'lackey.watch'
    ]);

    gulp.task('lackey.dev', [
        'lackey.server',
        'lackey.watch'
    ]);

    gulp.task('lackey.build', [
        'lackey.cleanup',
        'lackey.resources'
    ]);

    gulp.task('lackey.resources', [
        'lackey.sass',
        'lackey.js',
        'lackey.img',
        'lackey.fonts',
        'lackey.assets',
        'lackey.dust'
    ]);

    gulp.task('lackey.watch', () => {
        return gulp.watch([
            lackeyDIR + '/modules/*/client/**/*',
            lackeyDIR + '/modules/*/shared/**/*',
            projectDIR + '/modules/*/client/**/*',
            projectDIR + '/modules/*/shared/**/*',
            projectDIR + '/node_modules'
        ], [
            'lackey.resources'
        ]);
    });

    gulp.task('lackey.server.dev', function () {
        return nodemon({
            script: lackeyDIR + '/lib/server/start.js',
            exec: 'node --harmony --debug',
            ext: 'js yaml json',
            stdout: true,
            debug: true,
            ignore: [
                '*/htdocs/*',
                'modules/*/client/*'
            ],
            ignoreRoot: ['.git']
        });
    });

    gulp.task('lackey.server', function () {
        return nodemon({
            script: lackeyDIR + '/lib/server/start.js',
            exec: 'node --harmony',
            ext: 'js yaml json',
            stdout: true,
            debug: true,
            ignore: [
                '*/htdocs/*',
                'modules/*/client/*'
            ],
            ignoreRoot: ['.git']
        });
    });

    gulp.task('lackey.cleanup', function () {
        return del.sync([
            projectDIR + '/htdocs/**/*',
            projectDIR + '/htdocs/*',
            projectDIR + '/htdocs'
        ]);
    });

    gulp.task('lackey.sass', [
        'lackey.sass.cms',
        'lackey.sass.project'
    ]);

    gulp.task('lackey.assets', [
        'lackey.assets.cms',
        'lackey.assets.project'
    ]);

    gulp.task('lackey.js', [
        'lackey.js.cms',
        'lackey.js.project'
    ]);

    gulp.task('lackey.img', [
        'lackey.img.cms',
        'lackey.img.project'
    ]);

    gulp.task('lackey.fonts', [
        'lackey.fonts.cms',
        'lackey.fonts.project'
    ]);

    gulp.task('lackey.dust', [
        'lackey.dust.cms',
        'lackey.dust.project'
    ]);

    function sassTask(from, to) {
        return gulp
            .src(from + '/modules/*/client/scss/*.scss')
            .pipe(plumber())
            .pipe(sass({
                includePaths: [
                    lackeyDIR + '/node_modules'
                ]
            }))
            .on('error', sass.logError)
            .pipe(autoprefixer({
                browsers: ['last 2 versions', 'iOS >= 8', 'IE 9']
            }))
            .pipe(rename((path) => {
                path.dirname = path.dirname.replace(/^([^\/]+)\/client\/scss/, '$1/');
            }))
            .pipe(gulp.dest(
                htDocs + to
            ));
    }

    gulp.task('lackey.sass.cms', () => sassTask(lackeyDIR, '/css/cms'));
    gulp.task('lackey.sass.project', () => sassTask(projectDIR, '/css'));

    function jsTask(from, to) {
        return gulp
            .src(from + '/modules/*/client/js/**/*.js')
            .pipe(plumber())
            .pipe(browserify({
                paths: [
                    from + '/modules/',
                    'node_modules/',
                    'node_modules/lackey-cms/modules',
                    'node_modules/lackey-cms/node_modules'
                ],
                debug: true
            }))
            .pipe(rename((path) => {
                path.dirname = path.dirname.replace(/^([^\/]+)\/client\/js/, '$1/');
            }))
            .pipe(gulp.dest(
                htDocs + to
            ));
    }

    gulp.task('lackey.js.cms', () => jsTask(lackeyDIR, '/js/cms'));
    gulp.task('lackey.js.project', () => jsTask(projectDIR, '/js'));

    function copyTask(from, to) {
        return gulp.src(from)
            .pipe(rename((path) => {
                path.dirname = path.dirname.replace(/^([^\/]+)\/client\/([^\/]+)/, '/$1/');
            }))
            .pipe(gulp.dest(htDocs + to));
    }

    gulp.task('lackey.img.cms', () => copyTask(lackeyDIR + '/modules/*/client/img/**/*', '/img/cms'));
    gulp.task('lackey.img.project', () => copyTask(projectDIR + '/modules/*/client/img/**/*', '/img'));
    gulp.task('lackey.fonts.cms', () => copyTask(lackeyDIR + '/modules/*/client/fonts/**/*', '/fonts/cms'));
    gulp.task('lackey.fonts.project', () => copyTask(projectDIR + '/modules/*/client/fonts/**/*', '/fonts'));
    gulp.task('lackey.assets.cms', () => copyTask(lackeyDIR + '/modules/*/client/assets/**/*', '/assets/cms'));
    gulp.task('lackey.assets.project', () => copyTask(projectDIR + '/modules/*/client/assets/**/*', '/assets'));

    function dustTask(from, to) {
        return gulp
            .src([
            from + '/modules/*/client/views/**/*.dust',
            from + '/modules/*/shared/views/**/*.dust'
        ])
            .pipe(dust({
                name: (file) => {
                    let filePath = file.path;
                    filePath = path.relative(from, filePath);
                    filePath = filePath.replace(/^modules\/([^\/]+)\/(client|shared)\/views/, '$1');
                    filePath = path.join(to.replace(/^\/dust\//, ''), filePath);
                    filePath = filePath.replace(/\.dust$/, '');
                    return filePath;
                }
            }))
            .pipe(rename((path) => {
                path.dirname = path.dirname.replace(/^([^\/]+)\/(client|shared)\/views/, '/$1/');
            }))
            .pipe(gulp.dest(
                htDocs + to
            ));
    }

    gulp.task('lackey.dust.cms', () => dustTask(lackeyDIR, '/dust/cms'));
    gulp.task('lackey.dust.project', () => dustTask(projectDIR, '/dust/'));

};
