const WritableStream = require('stream').Writable

class Stream extends WritableStream {
  constructor (log) {
    super()

    this.buffer = ''
    this.log = log
  }

  _write (chunk, encoding, callback) {
    this.buffer += chunk

    for (
      let i;
      (i = this.buffer.indexOf('\n')) !== -1;
      this.buffer = this.buffer.slice(i + 1)
    ) {
      this.log(this.buffer.slice(0, i))
    }

    process.nextTick(callback)
  }
}

process.stdout = new Stream(console.log)
process.stderr = new Stream(console.error)
