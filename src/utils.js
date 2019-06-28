import util from 'util';

try {
  // eslint-disable-next-line no-var
  var debug = require('debug');
} catch (err) {
  debug = util.debuglog;
}

module.exports.debug = debug('logger');
