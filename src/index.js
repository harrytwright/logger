import fs from 'fs';
import util from 'util';
import path from 'path';

import _ from 'lodash';
import debug from 'debug';
import bunyan from 'bunyan';
import RotatingFileStream from 'bunyan-rotating-file-stream';

const _debug = debug('logger');

try {
  // eslint-disable-next-line no-var
  var safeJsonStringify = require('safe-json-stringify');
} catch (e) {
  safeJsonStringify = null;
}

let format = util.format;
if (!format) {
  // If node < 0.6, then use its `util.format`:
  // <https://github.com/joyent/node/blob/master/lib/util.js#L22>:
  const inspect = util.inspect;
  const formatRegExp = /%[sdj%]/g;
  format = function format(f) {
    if (typeof (f) !== 'string') {
      const objects = [];
      // eslint-disable-next-line no-var,no-plusplus
      for (var i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }
      return objects.join(' ');
    }

    // eslint-disable-next-line no-var,no-redeclare
    var i = 1;
    const args = arguments;
    const len = args.length;
    let str = String(f).replace(formatRegExp, function(x) {
      if (i >= len)
        return x;
      switch (x) {
        // eslint-disable-next-line no-plusplus
        case '%s': return String(args[i++]);
        // eslint-disable-next-line no-plusplus
        case '%d': return Number(args[i++]);
        // eslint-disable-next-line no-plusplus
        case '%j': return fastAndSafeJsonStringify(args[i++]);
        case '%%': return '%';
        default:
          return x;
      }
    });
    // eslint-disable-next-line no-plusplus
    for (let x = args[i]; i < len; x = args[++i]) {
      if (x === null || typeof (x) !== 'object') {
        str += ` ${x}`;
      } else {
        str += ` ${inspect(x)}`;
      }
    }
    return str;
  };
}


// ---- Levels

const TRACE = 10;
const DEBUG = 20;
const INFO = 30;
const WARN = 40;
const ERROR = 50;
const FATAL = 60;

const levelFromName = {
  'trace': TRACE,
  'debug': DEBUG,
  'info': INFO,
  'warn': WARN,
  'error': ERROR,
  'fatal': FATAL
};

const nameFromLevel = {};
Object.keys(levelFromName).forEach(function(name) {
  nameFromLevel[levelFromName[name]] = name;
});

const directory = './var/tmp/log';
createLogDirectory();

/**
 *
 * API:
 *
 *  import { Logger } from 'logger';
 *
 *  new Logger('Loggie')('http')('Log This Message')l
 *
 *  OR
 *
 *  import logger from 'logger';
 *  logger('http')('log this message');
 *
 *  const log = logger('http');
 *  log.info('log this message')
 *
 * */
function Logger(name, level = INFO) {
  _debug(`Creating buyan called: ${name} with level: ${level}`);
  const logger = bunyan.createLogger({
    name: name,
    serializers: {
      err: bunyan.stdSerializers.err,
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
      },
      {
        level: 'error',
        path: path.join(directory, 'error.log')
      }
    ]
  });

  /**
   * If we're testing we need to save the error logs if the
   * tests fail but in production we need both a rotating
   * file system and to log to the terminal
   *
   * Using the switch breakthrough this can be handled...
   * */
  if (process.env.NODE_ENV === 'production') {
    _debug('Adding RotatingFileStream');

    logger.addStream({
      stream: new RotatingFileStream({
        path: path.join(directory, `${name.toLowerCase()}.log`),
        period: '1d', // daily rotation
        totalFiles: 10, // keep up to 10 back copies
        rotateExisting: true, // Give ourselves a clean file when we start up, based on period
        threshold: '10m', // Rotate log files larger than 10 megabytes
        totalSize: '20m', // Don't keep more than 20mb of archived log files
        gzip: true // Compress the archive log files to save space
      })
    });
  }

  Logger.reopen = () => {
    logger.reopenFileStreams();
  };

  /**
   *
   * */
  function createLoggerWithNamespace(namespace, options) {
    if (namespace === null) {
      throw new Error('No options have been set for the logger tool');
    }

    let opts = _.clone(options || {});
    if (typeof namespace === 'object') {
      opts = namespace;
    } else {
      opts.namespace = namespace;
    }

    _debug('Creating logger with options', opts);
    const stream = logger.child(opts);

    /**
     *
     * */
    function log(message, object = { }, level) {
      if (typeof object === 'string') {
        level = object;
        object = { };
      }

      let newObject = _.cloneDeep(object);
      if (newObject.hasOwnProperty('type')) {
        level = newObject.type;
        delete newObject.type;
      }

      if ((newObject instanceof Error)) {
        level = 'error';
      }

      if (!(newObject instanceof Error) && newObject.hasOwnProperty('message')) {
        message = newObject.message;
        delete newObject.message;
      }

      if (level === 'error') {
        newObject = newObject instanceof Error ? newObject : new Error(newObject.message);
      }

      return emitter(resolveLevel(level || INFO))(newObject, message);
    }

    function emitter(level) {
      return function() {
        if (level >= createLoggerWithNamespace.level) {
          switch (level) {
            case DEBUG:
              stream.debug(...arguments);
              break;
            case WARN:
              stream.warn(...arguments);
              break;
            case INFO:
              stream.info(...arguments);
              break;
            case ERROR:
              stream.error(...arguments);
              break;
            case TRACE:
              stream.info(...arguments);
              break;
            case FATAL:
              stream.error(...arguments);
              break;
          }
        }
      };
    }

    Object.keys(levelFromName).forEach(function(name) {
      log[name] = emitter(resolveLevel(name));
    });

    return log;
  }

  createLoggerWithNamespace.level = resolveLevel(level);
  createLoggerWithNamespace.setLevel = setLevel;

  /**
   *
   * */
  function setLevel(level) {
    createLoggerWithNamespace.level = resolveLevel(level);
  }

  return createLoggerWithNamespace;
}


const defaultLogger = new Logger(process.env.npm_package_name || 'logger', INFO);
module.exports = defaultLogger;
module.exports.Logger = Logger;

/**
 * Resolve a level number, name (upper or lowercase) to a level number value.
 *
 * @param nameOrNum {String|Number} A level name (case-insensitive) or positive
 *      integer level.
 * @api public
 */
function resolveLevel(nameOrNum) {
  let level;
  const type = typeof (nameOrNum);
  if (type === 'string') {
    level = levelFromName[nameOrNum.toLowerCase()];
    if (!level) {
      throw new Error(format('unknown level name: "%s"', nameOrNum));
    }
  } else if (type !== 'number') {
    throw new TypeError(format('cannot resolve level: invalid arg (%s):',
      type, nameOrNum));
  } else if (nameOrNum < 0 || Math.floor(nameOrNum) !== nameOrNum) {
    throw new TypeError(format('level is not a positive integer: %s',
      nameOrNum));
  } else {
    level = nameOrNum;
  }
  return level;
}

function createLogDirectory() {
  // ensure log directory exists
  fs.existsSync(directory) || fs.mkdirSync(directory, { recursive: true });
}

// A JSON stringifier that handles cycles safely - tracks seen values in a Set.
function safeCyclesSet() {
  const seen = new Set();
  return function(key, val) {
    if (!val || typeof (val) !== 'object') {
      return val;
    }
    if (seen.has(val)) {
      return '[Circular]';
    }
    seen.add(val);
    return val;
  };
}

/**
 * A JSON stringifier that handles cycles safely - tracks seen vals in an Array.
 *
 * Note: This approach has performance problems when dealing with large objects,
 * see trentm/node-bunyan#445, but since this is the only option for node 0.10
 * and earlier (as Set was introduced in Node 0.12), it's used as a fallback
 * when Set is not available.
 */
function safeCyclesArray() {
  const seen = [];
  return function(key, val) {
    if (!val || typeof (val) !== 'object') {
      return val;
    }
    if (seen.indexOf(val) !== -1) {
      return '[Circular]';
    }
    seen.push(val);
    return val;
  };
}

/**
 * A JSON stringifier that handles cycles safely.
 *
 * Usage: JSON.stringify(obj, safeCycles())
 *
 * Choose the best safe cycle function from what is available - see
 * trentm/node-bunyan#445.
 */
const safeCycles = typeof (Set) !== 'undefined' ? safeCyclesSet : safeCyclesArray;

/**
 * A fast JSON.stringify that handles cycles and getter exceptions (when
 * safeJsonStringify is installed).
 *
 * This function attempts to use the regular JSON.stringify for speed, but on
 * error (e.g. JSON cycle detection exception) it falls back to safe stringify
 * handlers that can deal with cycles and/or getter exceptions.
 */
function fastAndSafeJsonStringify(rec) {
  try {
    return JSON.stringify(rec);
  } catch (ex) {
    try {
      return JSON.stringify(rec, safeCycles());
    } catch (e) {
      if (safeJsonStringify) {
        return safeJsonStringify(rec);
      } else {
        const dedupKey = e.stack.split(/\n/g, 3).join('\n');
        _warn(`${'bunyan: ERROR: Exception in '
          + '`JSON.stringify(rec)`. You can install the '
          + '"safe-json-stringify" module to have Bunyan fallback '
          + 'to safer stringification. Record:\n'}${
          _indent(format('%s\n%s', util.inspect(rec), e.stack))}`,
        dedupKey);
        return format('(Exception in JSON.stringify(rec): %j. '
          + 'See stderr for details.)', e.message);
      }
    }
  }
}

function _indent(s, indent) {
  if (!indent) indent = '    ';
  const lines = s.split(/\r?\n/g);
  return indent + lines.join(`\n${ indent}`);
}

/**
 * Warn about an bunyan processing error.
 *
 * @param msg {String} Message with which to warn.
 * @param dedupKey {String} Optional. A short string key for this warning to
 *      have its warning only printed once.
 */
function _warn(msg, dedupKey) {
  if (dedupKey) {
    if (_warned[dedupKey]) {
      return;
    }
    _warned[dedupKey] = true;
  }
  process.stderr.write(`${msg }\n`);
}
const _warned = {};
