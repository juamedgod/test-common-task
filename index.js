'use strict';

const _ = require('lodash');

const sets = ['bundle', 'ci', 'npm', 'test'];
module.exports = function(gulp) {
  return _.zipObject(sets, _.map(sets, (s) => require(`./tasks/${s}`)(gulp)));
};
