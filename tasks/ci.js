const _ = require('lodash');
const eslintTeamcity = require('eslint-teamcity');
const runSequence = require('run-sequence');

/**
 * ci tasks:
 * - `ci-lint`
 * - `ci-test`
 * @param {object} gulp - Gulp instance
 */
function ci(gulp) {
  const formatReportsConfig = {
    test: 'mocha-teamcity-reporter',
    coverage: ['lcov', 'json', 'text-summary', 'html', 'teamcity'],
    lint: eslintTeamcity
  };

  // this makes available the tasks: `lint` and `test`
  require('./test')(gulp, {formatReportsConfig});

  _.each(['lint', 'test'], function(name) {
    gulp.task(`ci-${name}`, () => {
      runSequence('clean', name);
    });
  });
}

module.exports = ci;