import fs from 'fs';
import util from 'util';

import _ from 'lodash';
import bunyan, { resolveLevel, INFO, stdSerializers } from 'bunyan';

import { debug } from './utils';
import Namespace from './namespace';
import _streams from './stream_map';

const directory = './var/tmp/log';
const loggers = { };

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

  debug(`Creating bunyan called: ${name} with level: ${level}`);
  this.logger = bunyan.createLogger(opts);

  // eslint-disable-next-line consistent-this
  const self = this;

  // This purely an interface so we can update our stream list
  this.addStream = function() {
    debug(`Adding new stream ${arguments[0]} to ${self.name}`);
    self.logger.addStream(...arguments);

    // TODO: Remove 2.0.0
    _streams.saveStreamsForLogger(self.logger);
  };

  // TODO: Remove 2.0.0
  _streams.saveStreamsForLogger(this.logger);

  const namespace = new Namespace(this);
  loggers[name] = namespace;

  return namespace;
}


let defaultLevel;
try {
  defaultLevel = resolveLevel(process.env.LOGGER_LEVEL);
  debug(`LOGGER_LEVEL is set, default logger is set to ${defaultLevel}`);
} catch (error) {
  defaultLevel = INFO;
  debug('LOGGER_LEVEL is not set, default logger is set to INFO');
}

let defaultName;
if (process.env.LOGGER_NAME && typeof process.env.LOGGER_NAME === 'string') {
  debug('LOGGER_NAME has been set');
  debug(`Default name '${process.env.LOGGER_NAME}' has been applied`);
  defaultName = process.env.LOGGER_NAME;
} else if (process.env.npm_package_name) {
  debug('LOGGER_NAME has not been set');
  debug(`Default name '${process.env.npm_package_name}' has been applied`);
  defaultName = process.env.npm_package_name;
} else {
  debug('If running this via pm2 please set LOGGER_NAME to a value');
  debug('Default name \'Logger\' has been applied');
  defaultName = 'Logger';
}

const defaultLogger = new Logger(defaultName, defaultLevel);
module.exports = defaultLogger;
module.exports.Logger = Logger;

module.exports.getAllStreams = util.deprecate(() => {
  return _streams.values();
}, 'Logger: getAllStreams() is depreciated. In 2.0.0 this method will be removed');

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
