/**
 * This is a collection of packages brought into one place, see each link for where they came from
 *
 * In the future I may add this as an optional dependency where if it already exists in the users package
 * it will be added in automatically.
 *
 * @link https://github.com/zeke/redact-url/blob/master/index.js
 * */

const uri = require('url')

/** @link https://github.com/sindresorhus/ip-regex/blob/main/index.js */

const v4 = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}'
const v4exact = new RegExp(`^${v4}$`)

/** @link https://github.com/segmentio/is-url/blob/master/index.js */

/**
 * RegExps.
 * A URL must match #1 and then at least one of #2/#3.
 * Use two levels of REs to avoid REDOS.
 */
const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/

const localhostDomainRE = /^localhost[:?\d]*(?:[^:?\d]\S*)?$/
const nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/

/**
 * Loosely validate a URL `string`.
 *
 * @param {String} string
 * @return {Boolean}
 */

function isUrl (string) {
  if (typeof string !== 'string') {
    return false
  }

  const match = string.match(protocolAndDomainRE)
  if (!match) {
    return false
  }

  const everythingAfterProtocol = match[1]
  if (!everythingAfterProtocol) {
    return false
  }

  return localhostDomainRE.test(everythingAfterProtocol) ||
    nonLocalhostDomainRE.test(everythingAfterProtocol)
}

/** @link https://github.com/kevva/url-regex/blob/master/index.js */

const tlds = require('./tlds.json')

function urlRegex (options = { strict: true, exact: true }) {
  const protocol = `(?:(?:[a-z]+:)?//)${options.strict ? '' : '?'}`
  const auth = '(?:\\S+(?::\\S*)?@)?'
  const ip = v4exact.source
  const host = '(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)'
  const domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*'
  const tld = `(?:\\.${options.strict ? '(?:[a-z\\u00a1-\\uffff]{2,})' : `(?:${tlds.sort((a, b) => b.length - a.length).join('|')})`})\\.?`
  const port = '(?::\\d{2,5})?'
  const path = '(?:[/?#][^\\s"]*)?'
  const regex = `(?:${protocol}|www\\.)${auth}(?:localhost|${ip}|${host}${domain}${tld})${port}${path}`

  return options.exact ? new RegExp(`(?:^${regex}$)`, 'i') : new RegExp(regex, 'ig')
}

/** @link https://github.com/zeke/redact-url/blob/master/index.js */
module.exports = (input, replacement = 'REDACTED') => {
  const isUrlWithPort = function (val) {
    if (isUrl(val)) return true
    if (urlRegex({
      strict: true,
      exact: true
    }).test(val)) return true
    return !!val.match && !!(val.match(/^git\+(https?|ssl)/) && urlRegex({
      strict: true,
      exact: false
    }).test(val))
  }

  // Require a URL or git+protocol URL-esque string
  // https://www.npmjs.org/doc/json.html#Git-URLs-as-Dependencies
  if (!isUrlWithPort(input)) return input

  const url = new uri.URL(input)

  if (url.username !== '' || url.password !== '') {
    url.username = replacement
    url.password !== '' && (url.password = '')
  }

  for (const searchParamsKey of url.searchParams.keys()) {
    if (searchParamsKey.match(/secret|pass|token|key|pwd/i)) url.searchParams.set(searchParamsKey, replacement)
  }

  return url.toString()
}
