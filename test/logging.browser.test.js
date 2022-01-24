describe('name', function () {
  const expect = chai.expect

  it('should set logger name to window.origin', function () {
    expect(logger.app).to.be.eq(window.origin)
  })
})
