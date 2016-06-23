const eslint = require('gulp-eslint');
const istanbul = require('gulp-istanbul');

/**
 * test tasks:
 * - `test`
 * - `pre-test`
 * @param {object} gulp - Gulp instance
 * @param {object} args
 * @param {array|string} args.sources - Glob selector for application sources
 * @param {array|string} args.tests - Glob selector for application tests sources
 */
function test(gulp, args) {
  const tests = args.tests;
  const sources = args.sources;
  const formatReportsConfig = args.formatReportsConfig || {
    test: 'spec',
    coverage: ['lcov', 'json', 'text-summary', 'html'],
    lint: undefined
  };

  gulp.task('lint', () => {
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
      .pipe(eslint.format(formatReportsConfig.lint));
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      // .pipe(eslint.failAfterError());
  });

  gulp.task('pre-test', () => {
    return gulp.src(sources)
      // Covering files
      .pipe(istanbul())
      // Force `require` to return covered files
      .pipe(istanbul.hookRequire());
  });

  gulp.task('test', ['pre-test'], () => {
    return gulp.src(tests, {read: false})
      .pipe(mocha({reporter: formatReportsConfig.test}))
      // Creating the reports after tests ran
      .pipe(istanbul.writeReports({reporters: formatReportsConfig.coverage}));
      // Enforce a coverage of at least 90%
      // .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
  });
}

module.exports = test;
