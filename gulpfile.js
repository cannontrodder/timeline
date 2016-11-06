/*jslint node: true */
"use strict";
var gulp = require("gulp");
var debug = require("gulp-debug");
var uglify = require("gulp-uglify");
var sequence = require("gulp-sequence");
var gutil = require("gulp-util");
var ts = require("gulp-typescript");
var del = require('del');

function swallowError(error) {
	console.log(error.toString());
	this.emit("end");
}

var tsFilesES6Glob = ["./**/*.ts", "!./node_modules/**/*", "!./timeline-play/**.*"];
var tsFilesES3Glob = ["./timeline-play/*.ts"];

var cleanGlob = ["./timeline-play/timeline-play.js", "./timeline.js"];

gulp.task("default", function(done) {
	sequence("typescript")(done);
});

gulp.task("watch", function() {
	gulp.watch(watchGlob, ["build"]);
});

gulp.task("typescript", ["typescript-es3", "typescript-es6"]);

gulp.task("typescript-es6", function() {
	return gulp.src(tsFilesES6Glob, {
			base: "./"
		})
		.pipe(debug())
		.pipe(ts({
			target: "ES6"
		}))
		.pipe(gulp.dest("./"));
});

gulp.task("typescript-es3", function() {
	return gulp.src(tsFilesES3Glob, {
			base: "./"
		})
		.pipe(debug())
		.pipe(ts({
			target: "ES3"
		}))
		.pipe(gulp.dest("./"));
});

gulp.task("clean", function() {
	return del(cleanGlob);
});