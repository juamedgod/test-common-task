const eslintTeamcity = require('eslint-teamcity');

 /**
  * ci tasks:
  * - `ci-lint`
  * - `ci-test`
  * - `ci-test:prepare`
  * - `ci-test:execute`
  * - `ci-test:clean`
  * @param {object} gulp - Gulp instance
  * @param {object} args
  * @param {array|string} args.sources - Glob selector for application sources
  * @param {array|string} args.tests - Glob selector for application tests sources
  * @param {object} [args.reportsConfig] - Configuration parameters for reporters
  */
function ci(gulp, args) {
  if (!args.reportsConfig) {
    args.reportsConfig = {
      test: 'mocha-teamcity-reporter',
      coverage: ['lcov', 'json', 'text-summary', 'html', 'teamcity'],
      lint: eslintTeamcity
    };
  }
  require('./test.js')(gulp, args, 'ci');
}

module.exports = ci;
