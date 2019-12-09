import util from 'util';
import { EventEmitter } from 'events';

import consoleControl from 'console-control-strings';

/**
 *
 * import log from '@harrytwright/logger'
 *
 * log.info('init', ...)
 * */

module.exports = Log;

function Log(app, level) {
  EventEmitter.call(this);

  this.level = level || 'info';
  this._heading = app || 'logger';

  this._buffer = [];

  this.id = 0;
  this.record = [];

  this.style = {};
  this.levels = {};
  this.display = {};

  this.prefixStyle = { fg: 'magenta' };
  this.headingStyle = { fg: 'white', bg: 'black' };

  this.addLevel('silly', -Infinity, { inverse: true }, 'sill');
  this.addLevel('verbose', 1000, { fg: 'blue', bg: 'black' }, 'verb');
  this.addLevel('info', 2000, { fg: 'green' });
  this.addLevel('timing', 2500, { fg: 'green', bg: 'black' });
  this.addLevel('http', 3000, { fg: 'green', bg: 'black' });
  this.addLevel('notice', 3500, { fg: 'blue', bg: 'black' });
  this.addLevel('warn', 4000, { fg: 'black', bg: 'yellow' }, 'WARN');
  this.addLevel('error', 5000, { fg: 'red', bg: 'black' }, 'ERR!');
  this.addLevel('silent', Infinity);
}

util.inherits(Log, EventEmitter);

Object.defineProperty(Log, 'app', {
  set: function(newApp) {
    this._heading = newApp;
  },
  get: function() {
    return this._heading;
  }
});

let stream = process.stderr;
Object.defineProperty(Log, 'stream', {
  set: function(newStream) {
    stream = newStream;
  },
  get: function() {
    return stream;
  }
});

Log.prototype.useColor = function() {
  // eslint-disable-next-line eqeqeq
  return this.colorEnabled != null ? this.colorEnabled : stream.isTTY;
};

Log.prototype.enableColor = function() {
  this.colorEnabled = true;
};

Log.prototype.disableColor = function() {
  this.colorEnabled = false;
};


Log.prototype._writeToStream = function(msg) {
  if (!stream) return;
  stream.write(msg);
};

// temporarily stop emitting, but don't drop
Log.prototype.pause = function() {
  this._paused = true;
};

Log.prototype.resume = function() {
  if (!this._paused) return;
  this._paused = false;

  const b = this._buffer;
  this._buffer = [];
  b.forEach(function(m) {
    this.emitLog(m);
  }, this);
};

Log.maxRecordSize = 10000;
Log.prototype._log = function(lvl, prefix, message) {
  const l = this.levels[lvl];
  if (l === undefined) {
    return this.emit('error', new Error(util.format('Undefined log level: %j', lvl)));
  }

  const a = new Array(arguments.length - 2);
  let stack = null;
  for (let i = 2; i < arguments.length; i++) { // eslint-disable-line no-plusplus
    const arg = a[i - 2] = arguments[i];

    // resolve stack traces to a plain string.
    if (typeof arg === 'object' && arg instanceof Error && arg.stack) {
      Object.defineProperty(arg, 'stack', {
        value: stack = `${arg.stack}`,
        enumerable: true,
        writable: true
      });
    }
  }

  if (stack) a.unshift(`${stack}\n`);
  message = util.format.apply(util, a);

  const m = {
    id: this.id++, // eslint-disable-line no-plusplus
    level: lvl,
    message: message,
    prefix: String(prefix || ''),
    messageRaw: a
  };

  this.emit('log', m);
  this.emit(`log.${lvl}`, m);

  this.record.push(m);
  const mrs = this.maxRecordSize;
  const n = this.record.length - mrs;
  if (n > mrs / 10) {
    const newSize = Math.floor(mrs * 0.9);
    this.record = this.record.slice(-1 * newSize);
  }

  this.emitLog(m);
};

Log.prototype.emitLog = function(m) {
  if (this._paused) {
    this._buffer.push(m);
    return;
  }

  const l = this.levels[m.level];
  if (l === undefined) return;
  if (l < this.levels[this.level]) return;
  if (l > 0 && !isFinite(l)) return;

  // If 'display' is null or undefined, use the lvl as a default
  // Allows: '', 0 as valid display
  const display = this.display[m.level] !== null ? this.display[m.level] : m.level;
  m.message.split(/\r?\n/).forEach(function(line) {
    if (this._heading) {
      this.write(this._heading, this.headingStyle);
      this.write(' ');
    }

    this.write(display, this.style[m.level]);
    const p = m.prefix || '';
    if (p) this.write(' ');
    this.write(p, this.prefixStyle);
    this.write(` ${line}\n`);
  }, this);
};

// Add format versions ??
Log.prototype._format = function(msg, style) {
  if (!stream) return;

  let output = '';
  if (this.useColor()) {
    style = style || {};
    const settings = [];
    if (style.fg) settings.push(style.fg);
    if (style.bg) settings.push(`bg${style.bg[0].toUpperCase()}${style.bg.slice(1)}`);
    if (style.bold) settings.push('bold');
    if (style.underline) settings.push('underline');
    if (style.inverse) settings.push('inverse');
    if (settings.length) output += consoleControl.color(settings);
    if (style.beep) output += consoleControl.beep();
  }
  output += msg;
  if (this.useColor()) {
    output += consoleControl.color('reset');
  }
  return output;
};

Log.prototype.write = function(msg, style) {
  if (!stream) return;

  stream.write(this._format(msg, style));
};

Log.prototype.addLevel = function(lvl, n, style, display) {
  // If 'display' is null or undefined, use the lvl as a default
  if (display == null) display = lvl; // eslint-disable-line eqeqeq
  this.levels[lvl] = n;
  this.style[lvl] = style;

  if (!this[lvl]) {
    this[lvl] = function() {
      const a = new Array(arguments.length + 1);
      a[0] = lvl;
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < arguments.length; i++) {
        a[i + 1] = arguments[i];
      }
      return this._log.apply(this, a);
    }.bind(this);
  }
  this.display[lvl] = display;
};

Log.prototype.output = function() {
  console.log.apply(console, arguments);
};
