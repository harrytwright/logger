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

describe('name', function () {
  const expect = chai.expect

  it('should set logger name to package.json name', function () {
    expect(logger.app).to.be.eq(require('../package.json').name)
  })
})

describe('redaction', function () {
  const expect = chai.expect

  let logger; let log; let stream; const prev = { ...process.env }

  before(function () {
    process.env.NODE_ENV = 'production'
    process.env.__testing_overide = false

    delete require.cache[require.resolve('../lib')]

    // Use the initial logger so we can use the check the initial redactions are handled
    stream = customStream()
    log = require('../lib')
    log.stream = stream
  })

  after(function () {
    delete require.cache[require.resolve('../lib')]
    process.env = prev
  })

  it('should work with a default redaction', function () {
    // This is set by package.json
    expect(log.redactions).to.have.lengthOf(1)

    log.verbose('namespace', { uri: 'https://password:password@example.com:3000' }, 'demo %s', 'https://password:password@example.com:3000')

    const record = log.record.pop()
    expect(record.message).to.be.eq('demo https://********@example.com:3000/')
    expect(record.context.uri).to.be.eq('https://********@example.com:3000/')
  })

  it('should throw on invalid redaction', function () {
    expect(() => logger.redaction(5)).to.throw()
  })

  it('should add a custom redaction', function () {
    log.redaction((value) => {
      if (typeof value === 'number') return (value >>> 0).toString(2)
      return value
    })

    expect(log.redactions).to.have.lengthOf(2)
    log.info('demo', 'binary output for 5 is %s', 10)

    const record = log.record.pop()
    expect(record.message).to.be.eq('binary output for 5 is 1010')
  })
})
