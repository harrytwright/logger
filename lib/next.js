const { Log, getEnv } = require('./log')

const hasEmitter = 'emitWarning' in process

function emitMyWarning (warning, code) {
  if (!emitMyWarning.warned || !emitMyWarning.warned[code]) {
    emitMyWarning.warned = { ...emitMyWarning.warned, [code]: true }
    hasEmitter
      ? process.emitWarning(warning, { code })
      : console.warn(warning)
  }
}

emitMyWarning.warned = {}

const isBrowser = typeof window === 'object'

const isNextJS = !!getEnv('__NEXT_PROCESSED_ENV')

if (!isNextJS) {
  emitMyWarning(
    "For using without next.js please use '@harrytwright/logger'",
    'ERR_NEXT_JS'
  )
}

// This is only for the browser, so window needs checking first
try /* istanbul ignore next */ {
  isBrowser && require('./browser')
} catch (_) {}

const name = getEnv('npm_package_name') || 'NextJS'

/* istanbul ignore next */
const NODE_ENV = process.env.NODE_ENV || 'development'
const isProduction = NODE_ENV === 'production'

module.exports = new Log(name, isProduction ? 'info' : 'silly', [])
module.exports.Log = Log
