import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import bunyan, { resolveLevel, INFO, stdSerializers } from 'bunyan';

// TODO: Add the abilty to add a new stream to all children loggers
/**
 * import logger from '@harrytwright/logger';
 * logger.addStream(...);
 * */

import { debug } from './utils';
import Namespace from './namespace';
import _streams from './stream_map';

try {
  // eslint-disable-next-line no-var
  var RotatingFileStream = require('bunyan-rotating-file-stream');
} catch (error) {
  debug(error.message);
  RotatingFileStream = undefined;
}

const directory = './var/tmp/log';
const loggers = { };
// let _streams = [];

/**
 * Logger is the factory class to create all loggers
 * from here this spawns a new bunyan logger that
 * requires a namespcae to connect to, this allows
 * each file tp still write logs to your streams but
 * allows them to be independent based on namwspace
 *
 * An example as such:
 *
 * import { Logger } from '@harrytwright/logger';
 *
 * const logger = new Logger('Test');
 * const log = logger('http');
 *
 * log('Hello World');
 *
 * @param name {string} The name for the bunyan logger
 * @param level {string|number} [INFO] The default level for your logger
 * @param options {object} Any options for the bunyan constructor API
 * */
function Logger(name, level = INFO, options) {
  if (name === null) {
    throw new Error('Cannot create a bunyan logger without a name, what life would it have?');
  }

  if (loggers[name]) {
    return loggers[name];
  }

  if (typeof name === 'object' && 'name' in name) {
    options = name;
    name = options.name || 'Logger';
  } else if (typeof level === 'object') {
    options = level;
    level = options.level || INFO;
  }

  this.name = name;
  this.level = resolveLevel(level);

  const opts = _.clone(options || {});
  if ('directory' in opts) {
    this.directory = opts.directory;
    delete opts.directory;
  } else {
    this.directory = directory;
  }

  createLogDirectory(this.directory);

  _.defaults(opts, createDefaultOptions(name, level));

  debug(`Creating buyan called: ${name} with level: ${level}`);
  this.logger = bunyan.createLogger(opts);

  // eslint-disable-next-line consistent-this
  const self = this;

  // const saveStreams = function(logger) {
  //   const streams = logger.streams
  //     .map((el) => el.stream)
  //     .filter((el) => el instanceof Writable && !_streams.includes(el));
  //
  //   if (streams.length === 0) { return; }
  //
  //   debug(`Updating saved streams for ${name}`);
  //   _streams = _streams.concat(streams);
  // };

  // This purely an interface so we can update our stream list
  this.addStream = function() {
    debug(`Adding new stream ${arguments[0]} to ${self.name}`);
    self.logger.addStream(...arguments);

    _streams.saveStreamsForLogger(self.logger);
  };

  // addStream({
  //   level: 'error',
  //   path: path.join(directory, 'error.log')
  // });
  //
  // if (process.env.NODE_ENV === 'production' && RotatingFileStream) {
  //   addStream({
  //     stream: defaultRotatingFileStream(name, roatingOptions)
  //   });
  // }

  _streams.saveStreamsForLogger(this.logger);

  const namespace = new Namespace(this);
  loggers[name] = namespace;

  return namespace;
}


let defaultLevel;
try {
  defaultLevel = resolveLevel(process.env.LOGGER_LEVEL);
} catch (error) {
  debug('LOGGER_LEVEL is not set, default logger is set to INFO');
  defaultLevel = INFO;
}

let defaultName;
if (process.env.LOGGER_NAME && typeof process.env.LOGGER_NAME === 'string') {
  defaultName = process.env.LOGGER_NAME;
} else if (process.env.npm_package_name) {
  defaultName = process.env.npm_package_name;
} else {
  debug('If running this via pm2 please set LOGGER_NAME to a value');
  debug('Default name \'Logger\' has been applied');
  defaultName = 'Logger';
}

const defaultLogger = new Logger(defaultName, defaultLevel);
module.exports = defaultLogger;
module.exports.Logger = Logger;

module.exports.defaultotatingFileStreamOptions = defaultotatingFileStreamOptions;
module.exports.defaultRotatingFileStream = defaultRotatingFileStream;
module.exports.getAllStreams = () => {
  return _streams.values();
};

/**
 * Defaults
 * */

function createDefaultOptions(name, level) {
  return Object.assign({}, {
    name: name,
    level: resolveLevel(level),
    serializers: {
      err: stdSerializers.err,
      req: function auditRequestSerializer(req) {
        if (!req || !req.connection) {
          return req;
        }

        return {
          method: req.method,
          url: req.url,
          headers: req.headers,
          remoteAddress: req.connection.remoteAddress,
          remotePort: req.connection.remotePort
        };
      },
      res: function auditResponseSerializer(res) {
        if (!res || !res.statusCode) {
          return res;
        }

        return {
          statusCode: res.statusCode,
          header: res._header
        };
      }
    },
    streams: [
      {
        level: resolveLevel(level),
        stream: process.stdout // log INFO and above to stdout
      }
    ]
  });
}

function defaultotatingFileStreamOptions(name) {
  return {
    path: path.join(directory, `${name.toLowerCase()}.log`),
    period: '1d', // daily rotation
    totalFiles: 10, // keep up to 10 back copies
    rotateExisting: true, // Give ourselves a clean file when we start up, based on period
    threshold: '10m', // Rotate log files larger than 10 megabytes
    totalSize: '20m', // Don't keep more than 20mb of archived log files
    gzip: true // Compress the archive log files to save space
  };
}

function defaultRotatingFileStream(name, options) {
  return new RotatingFileStream(_.defaults(options, defaultotatingFileStreamOptions(name)));
}

/**
 * Helpers
 * */

function createLogDirectory(directory) {
  // ensure log directory exists

  if (!fs.existsSync(directory)) {
    debug(`Creating log directory ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
  }
}
