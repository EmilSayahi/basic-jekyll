/**
 * @file
 *
 * Gulp tasks for the Savas Labs website.
 *
 * Table of contents:
 *   1. Styles
 *   2. Scripts
 *   3. Images
 *   4. Fonts
 *   5. Jekyll
 *   6. Style Guide
 *   7. Misc.
 */

// Define variables.
var accessibility  = require('gulp-accessibility');
var appendPrepend  = require('gulp-append-prepend');
var autoprefixer   = require('autoprefixer');
var browserSync    = require('browser-sync').create();
var cache          = require('gulp-cache');
var cleancss       = require('gulp-clean-css');
var concat         = require('gulp-concat');
var del            = require('del');
var gulp           = require('gulp');
var gutil          = require('gulp-util');
var imagemin       = require('gulp-imagemin');
var jpegRecompress = require('imagemin-jpeg-recompress');
var notify         = require('gulp-notify');
var postcss        = require('gulp-postcss');
var rename         = require('gulp-rename');
var run            = require('gulp-run');
var runSequence    = require('run-sequence');
var sass           = require('gulp-ruby-sass');
var uglify         = require('gulp-uglify');

// Include paths.
var paths          = require('./_assets/gulp_config/paths');

// -----------------------------------------------------------------------------
//   1: Styles
// -----------------------------------------------------------------------------

/**
 * Task: build:styles:main
 *
 * Uses Sass compiler to process styles, adds vendor prefixes, minifies, then
 * outputs file to the appropriate location.
 */
gulp.task('build:styles:main', function() {
    return sass(paths.sassFiles + '/main.scss', {
        style: 'compressed',
        trace: true,
        loadPath: [paths.sassFiles]
    }).pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
        .pipe(cleancss())
        .pipe(gulp.dest(paths.jekyllCssFiles))
        .pipe(gulp.dest(paths.siteCssFiles))
        .pipe(gulp.dest(paths.siteStyleGuide))
        .pipe(browserSync.stream())
        .on('error', gutil.log);
});

/**
 * Task: build:styles:critical
 *
 * Processes critical CSS, to be included in head.html.
 */
gulp.task('build:styles:critical', function() {
    return sass(paths.sassFiles + '/critical*.scss', {
        style: 'compressed',
        trace: true,
        loadPath: [paths.sassFiles]
    }).pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
        .pipe(cleancss())
        .pipe(gulp.dest('_includes/css'))
        .on('error', gutil.log);
});

/**
 * Task: build:styles:css
 *
 * Copies any other CSS files to the assets directory, to be used by pages/posts
 * that specify custom CSS files.
 */
gulp.task('build:styles:css', function() {
    return gulp.src([paths.sassFiles + '/*.css'])
      .pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
      .pipe(cleancss())
      .pipe(gulp.dest(paths.jekyllCssFiles))
      .pipe(gulp.dest(paths.siteCssFiles))
      .on('error', gutil.log);
});

/**
 * Task: build:styles
 *
 * Builds all site styles.
 */
gulp.task('build:styles', [
    'build:styles:main',
    'build:styles:critical',
    'build:styles:css'
]);

/**
 * Task: clean:styles
 *
 * Deletes all processed site styles.
 */
gulp.task('clean:styles', function(callback) {
    del([paths.jekyllCssFiles, paths.siteCssFiles, '_includes/critical.css']);
    callback();
});

/**
 * Task: build:styles:styleguide
 *
 * Generates CSS for the style guide.
 */
gulp.task('build:styles:styleguide', function() {
    return sass(paths.sassFiles + '/styleguide.scss', {
        style: 'compressed',
        trace: true,
        loadPath: [paths.sassFiles]
    }).pipe(postcss([ autoprefixer({ browsers: ['last 2 versions'] }) ]))
      .pipe(cleancss())
      .pipe(gulp.dest(paths.styleGuideAssets))
      .pipe(gulp.dest('styleguide'))
      .pipe(gulp.dest(paths.siteStyleGuide))
      .pipe(browserSync.stream())
      .on('error', gutil.log);
});

// -----------------------------------------------------------------------------
//   2: Scripts
// -----------------------------------------------------------------------------

/**
 * Task: build:scripts:global
 *
 * Concatenates and uglifies global JS files and outputs result to the
 * appropriate location.
 */
gulp.task('build:scripts:global', function() {
    return gulp.src([
        paths.jsFiles + '/global/lib' + paths.jsPattern,
        paths.jsFiles + '/global/*.js'
    ])
        .pipe(concat('main.js'))
        .pipe(uglify())

        // We need to add front matter so Jekyll will process variables.
        .pipe(appendPrepend.prependFile('./_assets/gulp_config/front-matter.txt'))

        // Only place in `assets` because Jekyll needs to process the file.
        .pipe(gulp.dest(paths.jekyllJsFiles))
        .on('error', gutil.log);
});

/**
 * Task: build:scripts:leaflet
 *
 * Concatenates and uglifies leaflet JS files and outputs result to the
 * appropriate location.
 */
gulp.task('build:scripts:leaflet', function() {
    return gulp.src([
        paths.jsFiles + '/leaflet/leaflet.js',
        paths.jsFiles + '/leaflet/leaflet-providers.js'
    ])
        .pipe(concat('leaflet.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.jekyllJsFiles))
        .pipe(gulp.dest(paths.siteJsFiles))
        .on('error', gutil.log);
});

/**
 * Task: build:scripts
 *
 * Builds all scripts.
 */
gulp.task('build:scripts', ['build:scripts:global', 'build:scripts:leaflet']);

/**
 * Task: clean:scripts
 *
 * Deletes all processed scripts.
 */
gulp.task('clean:scripts', function(callback) {
    del([paths.jekyllJsFiles, paths.siteJsFiles]);
    callback();
});

// -----------------------------------------------------------------------------
//   3: Images
// -----------------------------------------------------------------------------

/**
 * Task: build:images
 *
 * Optimizes and copies image files.
 *
 * We're including imagemin options because we're overriding the default JPEG
 * optimization plugin.
 */
gulp.task('build:images', function() {
    return gulp.src(paths.imageFilesGlob)
        .pipe(cache(imagemin([
            imagemin.gifsicle(),
            jpegRecompress(),
            imagemin.optipng(),
            imagemin.svgo()
        ])))
        .pipe(gulp.dest(paths.jekyllImageFiles))
        .pipe(gulp.dest(paths.siteImageFiles))
        .pipe(browserSync.stream());
});

/**
 * Task: clean:images
 *
 * Deletes all processed images.
 */
gulp.task('clean:images', function(callback) {
    del([paths.jekyllImageFiles, paths.siteImageFiles]);
    callback();
});

// -----------------------------------------------------------------------------
//   4: Fonts
// -----------------------------------------------------------------------------

/**
 * Task: build:fonts
 *
 * Copies fonts.
 */
gulp.task('build:fonts', ['fontawesome']);

/**
 * Task: fontawesome
 *
 * Places Font Awesome fonts in the proper location.
 */
gulp.task('fontawesome', function() {
    return gulp.src(paths.fontFiles + '/font-awesome/**.*')
        .pipe(rename(function(path) {path.dirname = '';}))
        .pipe(gulp.dest(paths.jekyllFontFiles))
        .pipe(gulp.dest(paths.siteFontFiles))
        .pipe(browserSync.stream())
        .on('error', gutil.log);
});

/**
 * Task: clean:fonts
 *
 * Deletes all processed fonts.
 */
gulp.task('clean:fonts', function(callback) {
    del([paths.jekyllFontFiles, paths.siteFontFiles]);
    callback();
});

// -----------------------------------------------------------------------------
//   5: Jekyll
// -----------------------------------------------------------------------------

/**
 * Task: build:jekyll
 *
 * Runs the jekyll build command.
 */
gulp.task('build:jekyll', function() {
    var shellCommand = 'bundle exec jekyll build --config _config.yml';

    return gulp.src('')
        .pipe(run(shellCommand))
        .on('error', gutil.log);
});

/**
 * Task: build:jekyll:test
 *
 * Runs the jekyll build command using the test config file.
 */
gulp.task('build:jekyll:test', function() {
    var shellCommand = 'bundle exec jekyll build --future --config _config.yml,_config.test.yml';

    return gulp.src('')
        .pipe(run(shellCommand))
        .on('error', gutil.log);
});

/**
 * Task: build:jekyll:local
 *
 * Runs the jekyll build command using the test and local config files.
 */
gulp.task('build:jekyll:local', function() {
    var shellCommand = 'bundle exec jekyll build --future --config _config.yml,_config.test.yml,_config.dev.yml';

    return gulp.src('')
        .pipe(run(shellCommand))
        .on('error', gutil.log);
});

/**
 * Task: clean:jekyll
 *
 * Deletes the entire _site directory.
 */
gulp.task('clean:jekyll', function(callback) {
    del(['_site']);
    callback();
});

/**
 * Task: clean
 *
 * Runs all the clean commands.
 */
gulp.task('clean', ['clean:jekyll',
    'clean:fonts',
    'clean:images',
    'clean:scripts',
    'clean:styles',
    'clean:styleguide']);

/**
 * Task: build
 *
 * Build the site anew.
 */
gulp.task('build', function(callback) {
    runSequence('clean',
        ['build:scripts', 'build:images', 'build:styles', 'build:fonts'],
        'styleguide',
        'build:jekyll',
        callback);
});

/**
 * Task: build:test
 *
 * Builds the site anew using test config.
 */
gulp.task('build:test', function(callback) {
    runSequence('clean',
        ['build:scripts', 'build:images', 'build:styles', 'build:fonts'],
        'styleguide',
        'build:jekyll:test',
        callback);
});

/**
 * Task: build:test
 *
 * Builds the site anew using test and local config.
 */
gulp.task('build:local', function(callback) {
    runSequence('clean',
        ['build:scripts', 'build:images', 'build:styles', 'build:fonts'],
        'styleguide',
        'build:jekyll:local',
      callback);
});

/**
 * Task: default
 *
 * Builds the site anew.
 */
gulp.task('default', ['build']);

/**
 * Task: build:jekyll:watch
 *
 * Special task for building the site then reloading via BrowserSync.
 */
gulp.task('build:jekyll:watch', ['build:jekyll:local'], function(callback) {
    browserSync.reload();
    callback();
});

/**
 * Task: build:scripts:watch
 *
 * Special task for building scripts then reloading via BrowserSync.
 */
gulp.task('build:scripts:watch', ['build:scripts'], function(callback) {
    runSequence('build:jekyll:local');
    browserSync.reload();
    callback();
});

/**
 * Task: serve
 *
 * Static Server + watching files.
 *
 * Note: passing anything besides hard-coded literal paths with globs doesn't
 * seem to work with gulp.watch().
 */
gulp.task('serve', ['build:local'], function() {

    browserSync.init({
        server: paths.siteDir,
        ghostMode: false, // Toggle to mirror clicks, reloads etc. (performance)
        logFileChanges: true,
        logLevel: 'debug',
        open: true        // Toggle to automatically open page when starting.
    });

    // Watch site settings.
    gulp.watch(['_config*.yml'], ['build:jekyll:watch']);

    // Watch .scss files; changes are piped to browserSync.
    // Ignore style guide SCSS.
    // Rebuild the style guide to catch updates to component markup.
    gulp.watch(
      ['_assets/styles/**/*.scss', '!_assets/styles/scss/07-styleguide/**/*', '!_assets/styles/styleguide.scss'],
      ['build:styles', 'build:styleguide']
    );

    // Watch .js files.
    gulp.watch('_assets/js/**/*.js', ['build:scripts:watch']);

    // Watch image files; changes are piped to browserSync.
    gulp.watch('_assets/img/**/*', ['build:images']);

    // Watch posts.
    gulp.watch('_posts/**/*.+(md|markdown|MD)', ['build:jekyll:watch']);

    // Watch drafts if --drafts flag was passed.
    if (module.exports.drafts) {
        gulp.watch('_drafts/*.+(md|markdown|MD)', ['build:jekyll:watch']);
    }

    // Watch HTML and markdown files.
    gulp.watch(
      ['**/*.+(html|md|markdown|MD)', '!_site/**/*.*', '!_styleguide_assets/**/*.*', '!_assets/styles/*.md'],
      ['build:jekyll:watch']);

    // Watch RSS feed XML files.
    gulp.watch('**.xml', ['build:jekyll:watch']);

    // Watch data files.
    gulp.watch('_data/**.*+(yml|yaml|csv|json)', ['build:jekyll:watch']);

    // Watch favicon.png.
    gulp.watch('favicon.png', ['build:jekyll:watch']);

    // Watch style guide SCSS.
    gulp.watch(
      ['_assets/styles/styleguide.scss', '_assets/styles/scss/07-styleguide/**/*.scss'],
      ['build:styles:styleguide']
    );

    // Watch style guide HTML.
    gulp.watch(
      ['_styleguide_assets/*.html', '_assets/styles/*.md'],
      ['build:styleguide', 'build:jekyll:watch']);
});

// -----------------------------------------------------------------------------
//   6: Style Guide
// -----------------------------------------------------------------------------

/**
 * Task: styleguide
 *
 * Creates the style guide within the _site directory.
 */
gulp.task('styleguide', function(callback) {
    runSequence('clean:styleguide',
      'build:styles:styleguide',
      'build:styleguide',
      callback);
});

/**
 * Task: build:styleguide
 *
 * Builds the style guide via the hologram gem.
 */
gulp.task('build:styleguide', function(callback) {
    var shellCommand = 'hologram -c hologram_config.yml';

    return gulp.src('')
      .pipe(run(shellCommand))
      .on('error', gutil.log);
});

/**
 * Task: clean:styleguide
 *
 * Deletes the entire _site/styleguide directory.
 */
gulp.task('clean:styleguide', function(callback) {
    del(['styleguide', '_site/styleguide']);
    callback();
});

// -----------------------------------------------------------------------------
//   7: Misc.
// -----------------------------------------------------------------------------

/**
 * Task: update:gems
 *
 * Updates Ruby gems.
 */
gulp.task('update:gems', function() {
    return gulp.src('')
        .pipe(run('bundle install'))
        .pipe(run('bundle update'))
        .pipe(notify({ message: 'Bundle Update Complete' }))
        .on('error', gutil.log);
});

/**
 * Task: cache-clear
 *
 * Clears the gulp cache. Currently this just holds processed images.
 */
gulp.task('cache-clear', function(done) {
    return cache.clearAll(done);
});

/**
 * Task: accessibility-test
 *
 * Runs the accessibility test against WCAG standards.
 *
 * Tests we're ignoring and why:
 *   1. WCAG2A.Principle1.Guideline1_3.1_3_1.H49.I: it's common practice (and,
 *   arguably, more semantic) to use <i> for icons.
 *   2. WCAG2A.Principle1.Guideline1_3.1_3_1.H48: This is throwing a false
 *   positive. We have marked up our menus as unordered lists.
 *   3. WCAG2A.Principle1.Guideline1_3.1_3_1.H49.AlignAttr: Sadly, we must
 *   ignore this test if we are to use our emoji plugin.
 *   4. WCAG2A.Principle1.Guideline1_3.1_3_1.H73.3.NoSummary: We can't use
 *   table summaries in kramdown in our blog posts.
 *   5. WCAG2A.Principle1.Guideline1_3.1_3_1.H39.3.NoCaption: We can't use
 *   table captions in kramdown in our blog posts.
 *   6. WCAG2A.Principle1.Guideline1_3.1_3_1.H42: This throws a lot of false
 *   positives for text that should not be headings.
 *
 * We're also skipping redirect pages like /news/* and /team/*.
 */
gulp.task('accessibility-test', function() {
    console.log('Auditing for accessibility...');
    return gulp.src(paths.htmlTestFiles)
    .pipe(accessibility({
        force: false,
        accessibilityLevel: 'WCAG2A',
        reportLevels: { notice: false, warning: true, error: true },
        ignore: [
          'WCAG2A.Principle1.Guideline1_3.1_3_1.H49.I',
          'WCAG2A.Principle1.Guideline1_3.1_3_1.H48',
          'WCAG2A.Principle1.Guideline1_3.1_3_1.H49.AlignAttr',
          'WCAG2A.Principle1.Guideline1_3.1_3_1.H73.3.NoSummary',
          'WCAG2A.Principle1.Guideline1_3.1_3_1.H39.3.NoCaption',
          'WCAG2A.Principle1.Guideline1_3.1_3_1.H42'
        ]
    }))
      .on('error', console.log)
      .on('end', function(){ console.log('Accessibility audit complete'); });
});
