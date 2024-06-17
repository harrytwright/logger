/**
 * Not really important but just nice to test
 * */

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

describe('logging', function () {
  const expect = chai.expect

  const prev = { ...process.env }

  before(function () {
    // No need to check stdin either
    // just wipe this
    logger.record = []
    logger.stream = process.stderr
  })

  describe('namespace is set', function () {
    it('should have the correct namespace', function () {
      logger.info('correct', 'something informative')
      const record = logger.record.pop()

      expect(record.namespace).to.be.equal('correct')
      expect(record.level).to.be.equal('info')
    })
  })

  describe('context is set', function () {
    it('should have the correct context', function () {
      logger.info('context', { hello: 'world' }, 'something informative')
      const record = logger.record.pop()

      expect(record.context).to.include.any.keys('hello')
      expect(record.context).to.be.deep.equal({ hello: 'world' })
    })
  })

  describe('pausing', function () {
    before(() => {
      process.env.__testing_override = false
      logger.stream = customStream()
    })

    after(() => {
      process.env = prev
      logger.stream = process.stderr
    })

    it('should populate the buffer', function () {
      logger.pause()

      logger.info('context', { hello: 'world' }, 'something informative')
      expect(logger.$__buffer).to.not.be.empty // eslint-disable-line

      logger.resume()
      expect(logger.stream.records).to.not.be.empty // eslint-disable-line
    })

    it('should return empty on resuming', function () {
      expect(() => logger.resume()).to.not.throw()
    })
  })

  describe('empty logging', function () {
    before(() => {
      process.env.__testing_override = false
      logger.stream = customStream()
    })

    after(() => {
      process.env = prev
      logger.stream = process.stderr
    })

    it('should throw', function () {
      expect(() => logger.info()).to.throw()
    })

    it('should handle empty namespace', function () {
      expect(() => logger.info(null)).to.not.throw()
    })

    // This is more for coverage checks
    it('should handle empty app with trace', function () {
      const app = logger.app
      logger.app = null

      expect(() => logger.info(null, { trace: 'qwertyuiop' })).to.not.throw()
      logger.app = app
    })
  })
})

describe('custom logger', function () {
  const expect = chai.expect

  let log; let stream; const prev = { ...process.env }

  before(function () {
    process.env.__testing_override = false

    stream = customStream()
    log = new logger.Log('custom', 'notice')
    log.stream = stream
  })

  after(function () {
    process.env = prev
  })

  it('should log the message', function () {
    log.notice('namespace', 'message')
    expect(stream.records).to.have.length(1)
  })

  it('should not log the message', function () {
    log.silly('namespace', 'message')
    expect(stream.records).to.have.length(1)
  })
})

describe('configuration', function () {
  const expect = chai.expect

  it('should update max record size', function () {
    const Log = logger.Log

    const log = new Log('maxRecordSize', 'silly')
    log.set('maxRecordSize', 2)

    log.silly('namespace', 'message')
    log.silly('namespace', 'message')
    log.silly('namespace', 'message')
    log.silly('namespace', 'message')

    expect(log.record).to.have.length(2)
  })

  it('should get/set app name', function () {
    const appName = 'should get/set app name'

    const Log = logger.Log
    const log = new Log()

    log.set('app', appName)
    expect(log.get('app')).to.be.eq(appName)

    log.app = appName
    expect(log.app).to.be.eq(appName)
  })

  it('should get/set app level', function () {
    const appLevel = 'silent'

    const Log = logger.Log
    const log = new Log()

    log.set('level', appLevel)
    expect(log.get('level')).to.be.eq(appLevel)

    log.level = appLevel
    expect(log.level).to.be.eq(appLevel)
  })

  it('should get/set app stream', function () {
    const stream = process.stdout

    const Log = logger.Log
    const log = new Log()

    log.set('stream', stream)
    expect(log.get('stream')).to.be.deep.eq(stream)

    log.stream = stream
    expect(log.stream).to.be.deep.eq(stream)
  })
})

describe('error-logging', function () {
  const expect = chai.expect

  before(function () {
    // No need to check stdin either
    // just wipe this
    logger.record = []
  })

  it('should log a valid error', function () {
    const error = new Error('error')
    logger.error('namespace', error)

    const record = logger.record.pop()
    expect(error.stack).to.be.eq(record.context.stack)
  })
})

/**
 * This is a very subjective use-case but allows for in dev view traces to be clumped with a set format
 *
 * May look at custom formats in the future?? Like how morgan works but allowing for custom keys maybe like
 * how you can use string interpolation, or maybe even that ??
 * */
describe('tracing', function () {
  const expect = chai.expect

  let log; let stream; const prev = { ...process.env }

  before(function () {
    stream = customStream()
    log = new logger.Log('custom', 'silly')
    log.stream = stream
  })

  after(function () {
    process.env = prev
  })

  it('should log a valid trace', function () {
    process.env.__testing_override = false
    log.info('namespace', { trace: '12345678910' }, 'Hello world')

    const record = log.record.pop()
    expect(record.context.trace).to.be.eq('12345678910')

    expect(stream.records.pop()).to.contains('12345678910')
  })

  //
  it('should allow for tracing to be added via injections', () => {
    process.env.__testing_override = false

    log.__unsafe_inject_context(ctx => ({
      trace: '12345678910'
    }))

    log.info('namespace', { }, 'Hello world')

    const record = log.record.pop()
    expect(record.context.trace).to.be.eq('12345678910')

    expect(stream.records.pop()).to.contains('12345678910')

    // Reset
    log.injections = []
  });
})
