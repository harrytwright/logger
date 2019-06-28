import { DEBUG, ERROR, FATAL, INFO, TRACE, WARN } from 'bunyan';

function emitter(stream, level) {
  return function() {
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
  };
}

module.exports = emitter;
