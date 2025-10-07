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

const { Log, getEnv } = require('./log')

function emitMyWarning (warning, code) {
  if (!emitMyWarning.warned || !emitMyWarning.warned[code]) {
    emitMyWarning.warned = { ...emitMyWarning.warned, [code]: true }
    process.emitWarning(warning, { code })
  }
}

emitMyWarning.warned = {}

// Emit a warning on failures, best for debugging
const tryRequire = (path) => {
  try {
    return require(path)
  } catch (_) {
    emitMyWarning(`Failed to find '${path}'`, `ERR_MISS_${path}`)
    return null
  }
}

const isBrowser = typeof window === 'object'

const isNextJS = !!getEnv('__NEXT_PROCESSED_ENV')

if (isNextJS) {
  emitMyWarning(
    "For using next.js please use '@harrytwright/logger/dist/next'",
    'ERR_NEXT_JS'
  )
}

// This is only for the browser, so window needs checking first
try /* istanbul ignore next */ {
  isBrowser && require('./browser')
} catch (_) {}

// Get the name for the logger
const pkg = (function () {
  try {
    const path = require('path')
    return require(require.resolve(path.join(process.cwd(), './package.json')))
  } catch (err) /* istanbul ignore next */ {
    const name =
      (typeof window === 'object' && window.location.origin) || 'logger'
    return { name }
  }
})()

const name = pkg.name

/* istanbul ignore next */
const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = NODE_ENV === 'production'

/**
 * Rather than me setting an initial redaction and bloating my own code, the end user
 * should set this, keeping this as simple as it can, just being a logger
 * */
const createInitialRedactions = (rest) => {
  const path = tryRequire('path')
  const redactions =
    (rest['@harrytwright/logger'] && rest['@harrytwright/logger'].redactions) ||
    []

  // This should not fail, so if someone adds an invalid package it won't fail
  return redactions
    .map((redaction) => {
      return /^\.?\.\//.test(redaction) && path
        ? require.resolve(
          path.relative(__dirname, path.join(process.cwd(), redaction))
        )
        : redaction
    })
    .map(tryRequire)
    .filter((el) => !!el)
}

/** @type {Function[]} */
const initialRedactions = createInitialRedactions(pkg)

module.exports = new Log(
  name,
  isProduction ? 'info' : 'silly',
  initialRedactions
)
module.exports.Log = Log
