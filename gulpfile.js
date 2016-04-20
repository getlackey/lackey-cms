var jsdoc = require('gulp-jsdoc3'),
    gulp = require('gulp');

gulp.task('doc', function (cb) {
    gulp.src(['../lackey/lib/**/*.js', '../lackey/modules/**/*.js'], {
            read: false
        })
        .pipe(jsdoc({
            'opts': {
                'destination': '.'
            },
            'tags': {
                'allowUnknownTags': true
            }
        }, cb));
});
