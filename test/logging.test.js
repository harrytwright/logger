/**
 * Not really important but just nice to test
 * */

const chai = require('chai')

const logger = require('../lib')

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

describe('logging', function () {
  before(function () {
    // No need to check stdin either
    // just wipe this
    logger.record = []
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
})

describe('custom logger', function () {
  let log, stream;

  before(function () {
    stream = customStream()
    log = new logger.Log('custom', 'notice')
    log.stream = stream
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
