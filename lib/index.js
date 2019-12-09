import fs from 'fs';
import path from 'path';

import Log from './logger';
import parseJSON from './parseJSON';

const config = { };

try {
  // startup, ok to do this synchronously
  // eslint-disable-next-line
  const j = parseJSON(fs.readFileSync(
    path.join(process.cwd(), './package.json')) + '');

  config.name = j.name;
} catch (err) {
  try {
    process.emitWarning('error reading global package name', {
      code: '@harrytwright/logger',
      detail: err.message
    });
  } catch (er) { /*  */}
  config.name = process.env.npm_package_name || 'logger';
}

if (process.env.LOGGING_LEVEL) {
  config.level = process.env.LOGGING_LEVEL;
} else if (process.env.NODE_ENV === 'test') {
  config.level = 'silent';
} else if (process.env.NODE_ENV === 'production') {
  config.level = 'http';
} else {
  config.level = 'info';
}


const log = new Log(config.name, config.level);
log.on('error', function() { /* */ });

module.exports = log;
module.exports.Log = Log;
