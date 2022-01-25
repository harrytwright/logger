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

const util = require('util')
const { EventEmitter } = require('events')

// This is only for the browser, so window needs checking first
try {
  typeof window === 'object' && require('./browser')
} catch (_) {}

// Get the name for the logger
const pkg = (function () {
  try {
    const path = require('path')
    return require(require.resolve(path.join(process.cwd(), './package.json')))
  } catch (err) {
    const name = (typeof window === 'object' && window.location.origin) || 'logger'
    return { name }
  }
}())

const name = pkg.name

/* istanbul ignore next */
const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = (NODE_ENV === 'production')

/* istanbul ignore next */
const isTest = () => process.env.__testing_overide != null
  ? false
  : NODE_ENV === 'test' ||
  NODE_ENV === 'testing'

// Emit a warning on failures, best for debugging
const tryRequire = (path) => {
  try { return require(path) } catch (_) { process.emitWarning(_); return null }
}

const REDACTION = process.env.LOGGER_REDACTION || '********'

/**
 * Rather than me setting an initial redaction and bloating my own code, the end user
 * should set this, keeping this as simple as it can, just being a logger
 * */
const createInitialRedactions = (rest) => {
  const path = tryRequire('path')

  const redactions = (rest['@harrytwright/logger'] && rest['@harrytwright/logger'].redactions) || []

  // This should not fail, so if someone adds an invalid package it won't fail
  return redactions.map((redaction) => {
    return /^\.?\.\//.test(redaction) && path ? require.resolve(path.relative(__dirname, path.join(process.cwd(), redaction))) : redaction
  }).map(tryRequire).filter((el) => !!el)
}

/** @type {Function[]} */
const initialRedactions = createInitialRedactions(pkg)

/**
 * Hold the internal/private configuration properties
 * */
const internalSlotsMap = new WeakMap([])

const kMaxRecordSize = 10000

function Log (app = 'logger', level = 'info') {
  EventEmitter.call(this)

  internalSlotsMap.set(this, {
    stream: typeof window === 'object' ? process.stdout : process.stderr,
    maxRecordSize: kMaxRecordSize,
    level,
    app
  })

  this.id = 0
  this.record = []

  this.redactions = initialRedactions

  this.$__buffer = []
  this.$__paused = false

  this.$__levels = {}
  this.$__display = {}

  this.addLevel('silly', -Infinity)
  this.addLevel('verbose', 1000, 'VERB')
  this.addLevel('info', 2000, 'INFO')
  this.addLevel('timing', 2500, 'TIME')
  this.addLevel('http', 3000, 'HTTP')
  this.addLevel('notice', 3500, 'NOTE')
  this.addLevel('warn', 4000, 'WARN')
  this.addLevel('error', 5000, 'ERR!')
  this.addLevel('silent', Infinity)

  // Freeze them so they can't be manipulated again
  this.$__levels = Object.freeze(this.$__levels)
  this.$__display = Object.freeze(this.$__display)

  this.set = this.set.bind(this)
  this.get = this.get.bind(this)
}

util.inherits(Log, EventEmitter)

/**
 * @param {"app"|"level"|"stream"|"maxRecordSize"} key
 * */
Log.prototype.get = function (key) {
  return internalSlotsMap.get(this)[key]
}

/**
 * @param {"app"|"level"|"stream"|"maxRecordSize"} key
 * @param {any} value
 * */
Log.prototype.set = function (key, value) {
  internalSlotsMap.get(this)[key] = value
}

Object.defineProperty(Log.prototype, 'app', {
  set: function (newValue) {
    this.set('app', newValue)
  },
  get: function () {
    return this.get('app')
  }
})

Object.defineProperty(Log.prototype, 'level', {
  set: function (newValue) {
    this.set('level', newValue)
  },
  get: function () {
    return this.get('level')
  }
})

Object.defineProperty(Log.prototype, 'stream', {
  set: function (newValue) {
    this.set('stream', newValue)
  },
  get: function () {
    return this.get('stream')
  }
})

// temporarily stop emitting, but don't drop
Log.prototype.pause = function () {
  this.$__paused = true
}

Log.prototype.resume = function () {
  if (!this.$__paused) return
  this.$__paused = false

  const b = this.$__buffer
  this.$__buffer = []
  b.forEach(function (m) {
    this.emitLog(m)
  }, this)
}

Log.prototype.redaction = function (redaction) {
  if (typeof redaction !== 'function') throw new Error(`Attempting to add invalid reaction of type [${typeof redaction}]`)
  this.redactions.push(redaction)
}

Log.prototype._log = function (lvl, namespace, ctx, message) {
  const l = this.$__levels[lvl]
  if (l === undefined) { /* istanbul ignore next */
    return this.emit('error', new Error(util.format('Undefined log level: %j', lvl)))
  }

  // Grab the context is passed
  let context; let stack = null
  const a = new Array(arguments.length - 2)
  for (let i = 2; i < arguments.length; i++) {
    const arg = a[i - 2] = arguments[i]

    if (typeof arg === 'object' && arg instanceof Error && arg.stack) {
      // resolve stack traces to a plain string inside the context
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

      if ('uri' in context || 'url' in context) {
        'uri' in context && (context.uri = redaction(this, context.uri))
        'url' in context && (context.url = redaction(this, context.url))
      }
    }
  }

  // Remove from the format array
  if (context) a.shift()
  // If we're not in production, we should use this
  /* istanbul ignore next */
  if (stack && !isProduction) a.unshift(`${stack}\n`)
  message = util.format.apply(util, a.map((value) => redaction(this, value)))

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
  const mrs = this.get('maxRecordSize')
  const n = this.record.length - mrs
  if (n > mrs / 10) {
    const newSize = Math.floor(mrs * 0.9)
    this.record = this.record.slice(-1 * newSize)
  }

  // Don't log the tests but save them
  if (isTest()) return
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
  if (this.$__paused) {
    this.$__buffer.push(m)
    return
  }

  const l = this.$__levels[m.level]
  if (l === undefined) return
  if (l < this.$__levels[this.level]) return
  if (l > 0 && !isFinite(l)) return

  // For production just log the JSON
  /* istanbul ignore next */
  if (isProduction) {
    delete m.id
    m.api = this.get('app')
    m.date = new Date().toUTCString()
    return this.write(`${JSON.stringify(m, '', 0)}\n`)
  }

  // If 'display' is null or undefined, use the lvl as a default
  // Allows: '', 0 as valid display
  const display = this.$__display[m.level] !== null ? this.$__display[m.level] : m.level
  m.message.split(/\r?\n/).forEach(function (line) {
    this.write(new Date().toUTCString())
    this.write(' - ')

    this.write(display)
    this.write(' ')

    if (this.get('app') || (m.context && m.context.trace)) {
      const title = []
      if (this.get('app')) title.push(this.get('app'))
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
  if (!this.get('stream')) return
  this.get('stream').write(msg)
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
  this.$__levels[lvl] = n

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
  this.$__display[lvl] = display
}

module.exports = new Log(name, isProduction ? 'info' : 'silly')
module.exports.Log = Log

/**
 * May look into this w/ custom initialRedactions that can be added via a
 * global `module.exports.redaction = (fn) => { // add redaction // }
 *
 * @param {Log} logger
 * @param {string} value
 * */
function redaction (logger, value) {
  if (!isProduction) return value
  return logger.redactions.reduce((previousValue, currentValue) => {
    return currentValue(previousValue, REDACTION)
  }, value)
}
