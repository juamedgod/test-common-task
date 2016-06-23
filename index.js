const _ = require('lodash');

const sets = ['bundle', 'ci', 'npm', 'test'];
module.exports = _.zipObject(sets, _.map(sets, (s) => require(`./tasks/${s}`)));
