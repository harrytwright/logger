const chai = require('chai')

const expect = chai.expect

function customStream () {
  let buffer = ''
  const records = []

  return {
    records,
    write: (msg) => {
      buffer += msg
      if (/[\r\n]/.exec(buffer)) {
        records.push(buffer)
        buffer = ''
      }
    }
  }
}

describe('redaction', function () {
  let logger; let log; let stream; const prev = { ...process.env }

  before(function () {
    process.env.NODE_ENV = 'production'

    delete require.cache[require.resolve('../lib')]
    logger = require('../lib')

    process.env.__testing_overide = false

    stream = customStream()
    log = new logger.Log('custom', 'silly')
    log.stream = stream
  })

  after(function () {
    delete require.cache[require.resolve('../lib')]
    process.env = prev
  })

  it('should work with the default redaction', function () {
    log.verbose('namespace', { uri: 'https://password:password@localhost:3000' }, 'demo %s', 'https://password:password@localhost:3000')

    const record = log.record.pop()
    expect(record.message).to.be.eq('demo https://********@localhost:3000/')
    expect(record.context.uri).to.be.eq('https://********@localhost:3000/')
  })

  it('should add a custom redaction', function () {
    logger.redaction((value) => {
      if (typeof value === 'number') return (value >>> 0).toString(2)
      return value
    })

    log.info('demo', 'binary output for 5 is %s', 10)

    const record = log.record.pop()
    expect(record.message).to.be.eq('binary output for 5 is 1010')
  })
})
