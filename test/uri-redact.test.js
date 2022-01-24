const assert = require("assert")
const redact = require("../lib/uri-redact")

describe("redact(str)", function() {

  it("returns non-URLs untouched", function() {
    assert.equal(redact("not-a-url"), "not-a-url")
  })

  it("returns clean URLs untouched", function() {
    assert.equal(redact("https://github.com/"), "https://github.com/")
  })

  it("replaces auth credentials in URL strings with 'REDACTED'", function() {
    assert.equal(redact("https://user:password@github.com/user/repo"), "https://REDACTED@github.com/user/repo")
    assert.equal(redact("https://:123456789@github.com/user/repo"), "https://REDACTED@github.com/user/repo")
  })

  it("accepts an optional replacement arugment", function() {
    assert.equal(redact("https://user:password@github.com/user/repo", ""), "https://github.com/user/repo")
    assert.equal(redact("https://user:password@github.com/user/repo", "xxx"), "https://xxx@github.com/user/repo")
  })

  it("supports git+http(s) URLs", function() {
    assert.equal(redact("git+https://user:password@github.com/user/repo", ""), "git+https://github.com/user/repo")
    assert.equal(redact("git+http://user:password@github.com/user/repo", "xxx"), "git+http://xxx@github.com/user/repo")
  })

  it("supports git+ssl URLs", function() {
    assert.equal(redact("git+ssl://user:password@github.com/user/repo", ""), "git+ssl://github.com/user/repo")
  })

  it("supports URLs with ports", function() {
    assert.equal(redact("http://user:password@github.com:1234/user/repo"), "http://REDACTED@github.com:1234/user/repo")
  });

  it("supports URLs unusual protocols", function() {
    assert.equal(redact("amqp://user:password@github.com:1234/user/repo"), "amqp://REDACTED@github.com:1234/user/repo")
  });

  describe("redacts query parameters with secret-sounding names", function() {

    it("token", function() {
      assert.equal(redact("https://api.github.com/repos/lunchbunny/lunchbunny-config/tarball/master?access_token=12345"), "https://api.github.com/repos/lunchbunny/lunchbunny-config/tarball/master?access_token=REDACTED")
    })

    it("secret", function() {
      assert.equal(redact("https://example.com/?secret_word=123"), "https://example.com/?secret_word=REDACTED")
    })

    it("password", function() {
      assert.equal(redact("https://example.com/?password=123"), "https://example.com/?password=REDACTED")
    })

    it("key", function() {
      assert.equal(redact("https://example.com/?a=1&key=2"), "https://example.com/?a=1&key=REDACTED")
    })

  })


})
