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
// eslint-disable-next-line no-nested-ternary
config.level = process.env.LOGGING_LEVEL || process.env.NODE_ENV === 'test' ?
  'silent' : process.env.NODE_ENV === 'production' ?
    'notice' : 'info';


const log = new Log(config.name, config.level);
log.on('error', function() { /* */ });

module.exports = log;
module.exports.Log = Log;
