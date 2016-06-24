'use strict';

const runSequence = require('run-sequence');
const eslint = require('gulp-eslint');
const istanbul = require('gulp-istanbul');
const del = require('del');


/**
 * test tasks:
 * - `lint`
 * - `test`
 * - `test:prepare`
 * - `test:execute`
 * - `test:clean`
 * @param {object} gulp - Gulp instance
 * @param {object} args
 * @param {array|string} args.sources - Glob selector for application sources
 * @param {array|string} args.tests - Glob selector for application tests sources
 * @param {object} [args.reportsConfig] - Configuration parameters for reporters
 * @param {object} [prefix] - Prefix for tests name. Usefull for creating tasks with same behaviour
 * but different configuration
 */
function test(gulp, args, prefix) {
  const tests = args.tests;
  const sources = args.sources;
  const reportsConfig = args.reportsConfig || {
    test: 'spec',
    coverage: ['lcov', 'json', 'text-summary', 'html'],
    lint: undefined
  };
  const _prefix = prefix ? `${prefix}-` : '';

  gulp.task(`${_prefix}lint`, () => {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(sources)
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    // .pipe(eslint.format('node_modules/eslint-teamcity/index.js'));
    .pipe(eslint.format(reportsConfig.lint));
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    // .pipe(eslint.failAfterError());
  });

  gulp.task(`${_prefix}test:prepare`, () => {
    return gulp.src(sources)
      // Covering files
      .pipe(istanbul())
      // Force `require` to return covered files
      .pipe(istanbul.hookRequire());
  });

  gulp.task(`${_prefix}test:execute`, () => {
    return gulp.src(tests, {read: false})
      .pipe(mocha({reporter: reportsConfig.test}))
      // Creating the reports after tests ran
      .pipe(istanbul.writeReports({reporters: reportsConfig.coverage}));
      // Enforce a coverage of at least 90%
      // .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
  });

  gulp.task(`${_prefix}test`, () => {
    runSequence('test:clean', 'test:prepare', 'test:execute');
  });

  gulp.task(`${_prefix}test:clean`, () => {
    return del([
      'coverage/**/*',
      'reports/**/*'
    ]);
  });
}

module.exports = test;
