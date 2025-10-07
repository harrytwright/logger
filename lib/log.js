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
const consoleControl = require('console-control-strings')
const { EventEmitter } = require('events')

// This is so we can overwrite it w/ react and maybe add more in the future
const getEnv = (env) => process.env[`REACT_APP_${env}`] || process.env[env]

/* istanbul ignore next */
const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = NODE_ENV === 'production'

/* istanbul ignore next */
const isTest = () =>
  getEnv('__testing_override') != null
    ? false
    : NODE_ENV === 'test' || NODE_ENV === 'testing'

const REDACTION = getEnv('LOGGER_REDACTION') || '********'

/**
 * Hold the internal/private configuration properties
 * */
const internalSlotsMap = new WeakMap([])

const kMaxRecordSize = 10000

function Log (app = 'logger', level = 'info', initialRedactions = []) {
  EventEmitter.call(this)

  internalSlotsMap.set(
    this,
    /* istanbul ignore next */ {
      stream: typeof window === 'object' ? process.stdout : process.stderr,
      maxRecordSize: kMaxRecordSize,
      redact: isProduction || typeof window === 'object',
      cli: false,
      color: true,
      level,
      app
    }
  )

  this.id = 0
  this.record = []

  this.redactions = [...initialRedactions]
  this.injections = []

  this.$__buffer = []
  this.$__paused = false

  this.$__levels = {}
  this.$__display = {}
  // Allow styling for CLI outputs
  this.$__style = {}

  this.addLevel('silly', -Infinity, 'SILL', { inverse: true })
  this.addLevel('verbose', 1000, 'VERB', { fg: 'cyan', bg: 'black' })
  this.addLevel('info', 2000, 'INFO', { fg: 'green' })
  this.addLevel('timing', 2500, 'TIME', { fg: 'green', bg: 'black' })
  this.addLevel('http', 3000, 'HTTP', { fg: 'green', bg: 'black' })
  this.addLevel('notice', 3500, 'NOTE', { fg: 'cyan', bg: 'black' })
  this.addLevel('warn', 4000, 'WARN', { fg: 'black', bg: 'yellow' })
  this.addLevel('error', 5000, 'ERR!', { fg: 'red', bg: 'black' })
  this.addLevel('silent', Infinity)

  // Freeze them so they can't be manipulated again
  this.$__levels = Object.freeze(this.$__levels)
  this.$__display = Object.freeze(this.$__display)

  this.set = this.set.bind(this)
  this.get = this.get.bind(this)
}

util.inherits(Log, EventEmitter)

/**
 * @param {"app"|"level"|"stream"|"maxRecordSize"|"redact"|"cli"|"color"} key
 * @returns any
 * */
Log.prototype.get = function (key) {
  return internalSlotsMap.get(this)[key]
}

/**
 * @param {"app"|"level"|"stream"|"maxRecordSize"|"redact"|"cli"|"color"} key
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

Object.defineProperty(Log.prototype, 'redact', {
  set: function (newValue) {
    this.set('redact', newValue)
  },
  get: function () {
    return this.get('redact')
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

Object.defineProperty(Log.prototype, 'cli', {
  set: function (newValue) {
    this.set('cli', newValue)
  },
  get: function () {
    return this.get('cli')
  }
})

Object.defineProperty(Log.prototype, 'color', {
  set: function (newValue) {
    this.set('color', newValue)
  },
  get: function () {
    return this.get('color')
  }
})

Log.prototype.usesColor = function () {
  return this.get('color') != null ? this.get('color') : this.get('stream').isTTY
}

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
  if (typeof redaction !== 'function') {
    throw new Error(
      `Attempting to add invalid reaction of type [${typeof redaction}]`
    )
  }
  this.redactions.push(redaction)
}

// This is sent out post redaction in order to inject values to the context, i.e. tracing
//
// This is just a concept, may not go anywhere, and will stay hidden from TS, only to be used
// by me in internal usage for now. Mainly to test timings etc
Log.prototype.__unsafe_inject_context = function (cb) {
  if (typeof cb !== 'function') return
  this.injections.push(cb)
}

Log.prototype._log = function (lvl, namespace, ctx, message) {
  const l = this.$__levels[lvl]
  if (l === undefined) {
    /* istanbul ignore next */
    return this.emit(
      'error',
      new Error(util.format('Undefined log level: %j', lvl))
    )
  }

  // Grab the context is passed
  let context
  let stack = null
  const a = new Array(arguments.length - 2)
  for (let i = 2; i < arguments.length; i++) {
    const arg = (a[i - 2] = arguments[i])

    if (typeof arg === 'object' && arg instanceof Error && arg.stack) {
      // resolve stack traces to a plain string inside the context
      // this will just clean up the log for any log reader
      if (!context) context = {}
      Object.defineProperty(context, 'stack', {
        value: (stack = `${arg.stack}`),
        enumerable: true,
        writable: true
      })

      a.pop()
    } else if (typeof arg === 'object' && i - 2 === 0) {
      context = arg
    }
  }

  if (context) {
    // Remove from the format array
    a.shift()
  }

  // Create a context regardless
  context = {
    ...(context || {}),
    ...this.injections.reduce((prev, curr) => {
      return {
        ...prev,
        ...curr(context)
      }
    }, {})
  }

  // Redact the context
  Object.entries(context).forEach(([key, value]) => {
    context[key] = redaction(this, value)
  })

  // If we're not in production, we should use this
  /* istanbul ignore next */
  if (stack && !isProduction) a.unshift(`${stack}\n`)
  message = util.format.apply(
    util,
    a.map((value) => redaction(this, value))
  )

  /**
   * @type LogContext
   * */
  const m = {
    id: this.id++,
    level: lvl,
    message,
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
  const display =
    this.$__display[m.level] !== null ? this.$__display[m.level] : m.level
  m.message.split(/\r?\n/).forEach(function (line) {
    this.__unsafe_handleLine(line, m, display)
  }, this)
}

const templates = {
  default: function (line, message, display) {
    this.write(new Date().toUTCString())
    this.write(' - ')

    this.write(display)
    this.write(' ')

    if (this.get('app') || (message.context && message.context.trace)) {
      const title = []
      if (this.get('app')) title.push(this.get('app'))
      if (message.context && !!message.context.trace) { title.push(message.context.trace.toString()) }

      this.write('[')
      this.write(title.join(','))
      this.write(']')
    }

    const n = message.namespace || ''
    if (n) this.write(' ')

    this.write(n)
    if (n !== '') this.write(': ')

    this.write(`${line}\n`)
  },
  cli: function (line, message, display) {
    this.write(display, this.$__style[message.level])
    const n = message.namespace || ''
    if (n) {
      this.write(' ')
    }

    this.write(n)
    if (n !== '') this.write(': ')
    this.write(`${line}\n`)
  }
}

Log.prototype.__unsafe_handleLine = function (line, message, display) {
  if (this.cli) return templates.cli.call(this, ...arguments)
  return templates.default.call(this, ...arguments)
}

Log.prototype.__unsafe_format = function (msg, style) {
  if (!this.stream) {
    return
  }

  let output = ''
  if (this.usesColor()) {
    style = style || {}
    const settings = []
    if (style.fg) {
      settings.push(style.fg)
    }

    if (style.bg) {
      settings.push('bg' + style.bg[0].toUpperCase() + style.bg.slice(1))
    }

    if (style.bold) {
      settings.push('bold')
    }

    if (style.underline) {
      settings.push('underline')
    }

    if (style.inverse) {
      settings.push('inverse')
    }

    if (settings.length) {
      output += consoleControl.color(settings)
    }

    if (style.beep) {
      output += consoleControl.beep()
    }
  }
  output += msg
  if (this.usesColor()) {
    output += consoleControl.color('reset')
  }

  return output
}

/**
 * Write the value to stream
 *
 * @param {string} msg - The value to be streamed
 *
 * @private
 * */
Log.prototype.write = function (msg, style) {
  if (!this.get('stream')) return
  this.get('stream').write(this.__unsafe_format(msg, style))
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
Log.prototype.addLevel = function (lvl, n, display, style) {
  // If 'display' is null or undefined, use the lvl as a default
  if (display == null) display = lvl // eslint-disable-line eqeqeq
  this.$__levels[lvl] = n
  this.$__style[lvl] = style

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

/**
 * May look into this w/ custom initialRedactions that can be added via a
 * global `module.exports.redaction = (fn) => { // add redaction // }
 *
 * @param {Log} logger
 * @param {string} value
 * */
function redaction (logger, value) {
  if (!logger.redact) return value
  return logger.redactions.reduce((previousValue, currentValue) => {
    return currentValue(previousValue, REDACTION)
  }, value)
}

module.exports = { Log, getEnv }
