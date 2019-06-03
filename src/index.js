import fs from 'fs';
import util from 'util';
import path from 'path';

import _ from 'lodash';
import bunyan from 'bunyan';
import RotatingFileStream from 'bunyan-rotating-file-stream';

var format = util.format;
if (!format) {
  // If node < 0.6, then use its `util.format`:
  // <https://github.com/joyent/node/blob/master/lib/util.js#L22>:
  var inspect = util.inspect;
  var formatRegExp = /%[sdj%]/g;
  format = function format(f) {
    if (typeof (f) !== 'string') {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }
      return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function (x) {
      if (i >= len)
        return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j': return fastAndSafeJsonStringify(args[i++]);
        case '%%': return '%';
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (x === null || typeof (x) !== 'object') {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }
    return str;
  };
}


//---- Levels

var TRACE = 10;
var DEBUG = 20;
var INFO = 30;
var WARN = 40;
var ERROR = 50;
var FATAL = 60;

var levelFromName = {
  'trace': TRACE,
  'debug': DEBUG,
  'info': INFO,
  'warn': WARN,
  'error': ERROR,
  'fatal': FATAL
};

var nameFromLevel = {};
Object.keys(levelFromName).forEach(function (name) {
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

  let logger;

  logger = bunyan.createLogger({
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
        }
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
    logger.addStream({
      stream: new RotatingFileStream({
        path: path.join(directory, `${name.toLowerCase()}.log`),
        period: '1d', // daily rotation
        totalFiles: 10, // keep up to 10 back copies
        rotateExisting: false, // Give ourselves a clean file when we start up, based on period
        threshold: '10m', // Rotate log files larger than 10 megabytes
        totalSize: '20m', // Don't keep more than 20mb of archived log files
        gzip: true // Compress the archive log files to save space
      })
    });
  }

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
      opts.namespace = namespace
    };

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
        newObject = newObject instanceof Error ? newObject : new Error(newObject.message)
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

    Object.keys(levelFromName).forEach(function (name) {
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
};



let defaultLogger = new Logger(process.env.npm_package_name || 'logger', INFO);
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
  var level;
  var type = typeof (nameOrNum);
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
