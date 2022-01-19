/**
 * %DATE %LEVEL [$API,$TRACE?] $NAMESPACE : $MESSAGE
 *
 * 2020-04-09 17:45:40.516 ERROR [pumaflow-api] controller: Uncaught exception thrown
 *
 * {
 *   date: "2020-04-09 17:45:40.516",
 *   level: "ERROR",
 *   api: "pumaflow-api",
 *   namespace: "controller",
 *   message: "Uncaught exception thrown",
 *   context: {
 *     error: ...
 *   }
 * }
 * */

/* istanbul ignore file */

const fs = require('fs')
const path = require('path')
const util = require('util')
const { EventEmitter } = require('events')

const { name } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8')
)

const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = (NODE_ENV === 'production')

/* istanbul ignore next */
const isTest = NODE_ENV === 'test' ||
  NODE_ENV === 'testing'

function Log (app, level) {
  EventEmitter.call(this)

  this._level = level || 'info'
  this._heading = app || 'logger'

  this.id = 0
  this.record = []

  this._buffer = []
  this._paused = false

  this.levels = {}
  this.display = {}

  this.addLevel('silly', -Infinity)
  this.addLevel('verbose', 1000, 'VERB')
  this.addLevel('info', 2000, 'INFO')
  this.addLevel('timing', 2500, 'TIME')
  this.addLevel('http', 3000, 'HTTP')
  this.addLevel('notice', 3500, 'NOTE')
  this.addLevel('warn', 4000, 'WARN')
  this.addLevel('error', 5000, 'ERR!')
  this.addLevel('silent', Infinity)
}

util.inherits(Log, EventEmitter)

Object.defineProperty(Log.prototype, 'app', {
  set: function (newApp) {
    this._heading = newApp
  },
  get: function () {
    return this._heading
  }
})

Object.defineProperty(Log.prototype, 'level', {
  set: function (newLevel) {
    this._level = newLevel
  },
  get: function () {
    return this._level
  }
})

let stream = process.stderr
Object.defineProperty(Log.prototype, 'stream', {
  set: function (newStream) {
    stream = newStream
  },
  get: function () {
    return stream
  }
})

// temporarily stop emitting, but don't drop
Log.prototype.pause = function () {
  this._paused = true
}

Log.prototype.resume = function () {
  if (!this._paused) return
  this._paused = false

  const b = this._buffer
  this._buffer = []
  b.forEach(function (m) {
    this.emitLog(m)
  }, this)
}

Log.maxRecordSize = 10000
Log.prototype._log = function (lvl, namespace, ctx, message) {
  const l = this.levels[lvl]
  if (l === undefined) {
    return this.emit('error', new Error(util.format('Undefined log level: %j', lvl)))
  }

  // Grab the context is passed
  let context; let stack = null
  const a = new Array(arguments.length - 2)
  for (let i = 2; i < arguments.length; i++) {
    const arg = a[i - 2] = arguments[i]

    if (typeof arg === 'object' && arg instanceof Error && arg.stack) {
      // resolve stack traces to a plain string inside of the context
      // this will just clean up the log for any log reader
      if (!context) context = { }
      Object.defineProperty(context, 'stack', {
        value: stack = `${arg.stack}`,
        enumerable: true,
        writable: true
      })

      a.pop()
    } else if (typeof arg === 'object' && (i - 2 === 0)) {
      context = arg
    }
  }

  // Remove from the format array
  if (context) a.shift()
  // If we're not in production, we should use this
  if (stack && !isProduction) a.unshift(`${stack}\n`)
  message = util.format.apply(util, a)

  /**
   * @type LogContext
   * */
  const m = {
    id: this.id++,
    level: lvl,
    message: message,
    namespace,
    context
  }

  this.record.push(m)
  const mrs = this.maxRecordSize
  const n = this.record.length - mrs
  if (n > mrs / 10) {
    const newSize = Math.floor(mrs * 0.9)
    this.record = this.record.slice(-1 * newSize)
  }

  // Don't log the tests but save them
  if (isTest) return
  this.emitLog(m)
}

/**
 * @typedef {Object} LogContext
 *
 * @property {number} id - The value for the log
 * @property {string} level - The string value for the log level
 * @property {string} message - The parsed and formatted message
 * @property {string} namespace - The log namespace, helps narrow down calls
 * @property {Object} context - The message context for any extra values
 * */

/**
 * @property {LogContext} m - The log message context
 * @private
 * */
Log.prototype.emitLog = function (m) {
  if (this._paused) {
    this._buffer.push(m)
    return
  }

  const l = this.levels[m.level]
  if (l === undefined) return
  if (l < this.levels[this._level]) return
  if (l > 0 && !isFinite(l)) return

  // For production just log the JSON
  if (isProduction) {
    delete m.id
    m.api = this._heading
    m.date = new Date().toUTCString()
    return this.write(`${JSON.stringify(m, '', 0)}\n`)
  }

  // If 'display' is null or undefined, use the lvl as a default
  // Allows: '', 0 as valid display
  const display = this.display[m.level] !== null ? this.display[m.level] : m.level
  m.message.split(/\r?\n/).forEach(function (line) {
    this.write(new Date().toUTCString())
    this.write(' - ')

    this.write(display)
    this.write(' ')

    if (this._heading || (m.context && m.context.trace)) {
      const title = []
      if (this._heading) title.push(this._heading)
      if (m.context && !!m.context.trace) title.push(m.context.trace.toString())

      this.write('[')
      this.write(title.join(','))
      this.write(']')
    }

    const n = m.namespace || ''
    if (n) this.write(' ')

    this.write(n)
    if (n !== '') this.write(': ')

    this.write(`${line}\n`)
  }, this)
}

/**
 * Write the value to stream
 *
 * @param {string} msg - The value to be streamed
 *
 * @private
 * */
Log.prototype.write = function (msg) {
  if (!stream) return
  stream.write(msg)
}

/**
 * Template function builder
 *
 * With a level, its corresponding value and
 * what to call it, we can create new levels
 *
 * @param {string} lvl - The level name, to be called `log[lvl](...)`
 * @param {number} n - The level value, starts at -Infinite, to Infinite
 * @param {string} [display] - The display name, all standard values are
 *                             trimmed to 4 characters
 * @private
 * */
Log.prototype.addLevel = function (lvl, n, display) {
  // If 'display' is null or undefined, use the lvl as a default
  if (display == null) display = lvl // eslint-disable-line eqeqeq
  this.levels[lvl] = n

  if (!this[lvl]) {
    this[lvl] = function () {
      const a = new Array(arguments.length + 1)
      a[0] = lvl
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < arguments.length; i++) {
        a[i + 1] = arguments[i]
      }
      return this._log.apply(this, a)
    }.bind(this)
  }
  this.display[lvl] = display
}

module.exports = new Log(name, isProduction ? 'info' : 'silly')
module.exports.Log = Log
