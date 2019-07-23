import util from 'util';
import path from 'path';
import fs from 'fs';

try {
  // eslint-disable-next-line no-var
  var debug = require('debug');
} catch (err) {
  debug = util.debuglog;
}

module.exports.debug = debug('logger');

module.exports.createDirForStream = (stream) => {
  if ('path' in stream) {
    createLogDirectory(path.dirname(stream.path));
  }
};

function createLogDirectory(directory) {
  // ensure log directory exists

  if (!fs.existsSync(directory)) {
    debug(`Creating log directory ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
  }
}

module.exports.createLogDirectory = createLogDirectory;
