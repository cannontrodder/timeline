/*jslint node: true */
"use strict";
var gulp = require("gulp"),
    debug = require("gulp-debug"),
    uglify = require('gulp-uglify'),
    sequence = require('gulp-sequence');

function swallowError(error) {
    console.log(error.toString());
    this.emit('end');
}

var tsFilesGlob = ["./**/*.ts", "!./node_modules/**/*"];

gulp.task("default", function (done) {
    sequence("typescript")(done);
});

gulp.task("watch", function () {
    gulp.watch(watchGlob, ["build"]);
});

gulp.task("typescript", function () {
    return gulp.src(tsFilesGlob)
    	.pipe(debug());
});