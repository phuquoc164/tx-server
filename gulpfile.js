const gulp = require("gulp");
const htmlmin = require("gulp-htmlmin");
const newer = require("gulp-newer");
const rimraf = require("gulp-rimraf");

gulp.task("clean", function() {
    gulp.src("./dist/*", { read: false })
        .pipe(rimraf());
});


// Common Tasks
gulp.task("copy", () => {
    gulp.src([paths.favicon], {base: paths.project})
        .pipe(newer(paths.dest))
        .pipe(gulp.dest(paths.dest));
});

// minify html & copy over
gulp.task("html", () => {
    gulp.src(paths.html, {base: paths.project})
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(paths.dest));
});
gulp.task("default", ["clean",/* "compile-ts", "copy-server-resources" ,*/"build_client_"+(config.APPLICATION).toLowerCase()]);