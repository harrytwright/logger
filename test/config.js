const util = require('util');

const debug = util.debuglog('logger');
const logger = require('../src');
/**
 * Graceful exit for async STDIO
 */

const _exit = process.exit;
process.exit = exit;

function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    // eslint-disable-next-line no-plusplus
    if (!(draining--)) { debug(`Exiting with code ${code}`); _exit(Number(code) || 1); }
  }

  let draining = 0;
  const streams = logger.getAllStreams();

  exit.exited = true;

  streams.forEach(function(stream) {
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();
}
