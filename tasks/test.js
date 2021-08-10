const fs = require('fs-extra');
const runSequence = require('gulp4-run-sequence');
const eslint = require('gulp-eslint');
const jscpd = require('gulp-jscpd');
const del = require('del');
const shell = require('gulp-shell');

module.exports = function(gulp) {
  /**
   * test tasks:
   * - `lint`
   * - `cpd`
   * - `test`
   * - `test:prepare`
   * - `test:execute`
   * - `test:clean`
   * @param {object} opts
   * @param {array|string} opts.sources - Glob selector for application sources
   * @param {array|string} opts.tests - Glob selector for application tests sources
   * @param {object} [opts.reportsConfig] - Configuration parameters for reporters
   * but different configuration
   */
  function test(opts) {
    opts = opts || {};
    const {tests} = opts;
    const {sources} = opts;
    const reportsFolder = './artifacts/reports';
    const namespace = opts.namespace || null;
    const cwd = opts.cwd || process.cwd();
    const reportsConfig = opts.reportsConfig || {
      test: 'spec',
      coverage: ['lcov', 'json', 'text-summary', 'html'],
      lint: undefined,
      cpd: 'xml',
    };

    function taskName(n) {
      return namespace ? `${namespace}-${n}` : n;
    }

    gulp.task(taskName('lint'), () => {
      // ESLint ignores files with "node_modules" paths.
      // So, it's best to have gulp ignore the directory as well.
      // Also, Be sure to return the stream from the task;
      // Otherwise, the task may end before the stream has finished.
      return gulp.src(sources, {cwd: cwd})
      // eslint() attaches the lint output to the "eslint" property
      // of the file object so it can be used by other modules.
        .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format(reportsConfig.lint))
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
    });

    gulp.task(taskName('cpd'), () => {
      fs.ensureDirSync(reportsFolder);
      return gulp.src(sources, {cwd: cwd})
        .pipe(jscpd({
          languages: ['javascript'],
          reporter: reportsConfig.cpd,
          output: `${reportsFolder}/cpd.xml`,
          silent: false,
          failOnError: false,
        }));
    });

    gulp.task(taskName('test:prepare'), (cb) => {
      fs.ensureDirSync(reportsFolder);
      cb(null);
    });

    gulp.task(taskName('test:execute'), () => {
      return gulp.src('.')
        .pipe(shell(`nyc --clean --report-dir=artifacts/reports/coverage/ --reporter=lcov --reporter=text --reporter=html mocha --reporter ${reportsConfig.test}`));
      // Enforce a coverage of at least 90%
      // .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
    });


    gulp.task(taskName('test:clean'), () => {
      return del([
        'artifacts/reports/coverage/**/*'
      ]);
    });
    gulp.task(taskName('test'), gulp.series([taskName('test:clean'), taskName('test:prepare'), taskName('test:execute')]));
  }
  return test;
};
