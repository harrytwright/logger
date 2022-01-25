describe('name', function () {
  const expect = chai.expect

  it('should set logger name to window.origin', function () {
    expect(logger.app).to.be.eq(window.origin)
  })
})

describe('redaction', function () {
  const expect = chai.expect

  const prev = { ...process.env }

  before(() => {
    process.env.__testing_overide = true
  })

  after(() => {
    process.env = prev
  })

  it('should throw on invalid redaction', function () {
    expect(() => logger.redaction(5)).to.throw()
  })

  it('should add a custom redaction', function () {
    logger.redaction((value) => {
      if (typeof value === 'number') return (value >>> 0).toString(2)
      return value
    })

    // We can't test this as there is no way to change the production env here
    expect(logger.redactions).to.have.lengthOf(1)

    logger.info('demo', 'binary output for 5 is %s', 10)

    const record = logger.record.pop()
    expect(record.message).to.be.eq('binary output for 5 is 1010')
  })
})
