const logger = require('../lib');
console.log(logger.Log);
logger.pause()
logger.info('common', 'hello world');
logger.error('init', 'Oh no')
logger.resume()

// require('./config');
//
// const { RingBuffer } = require('bunyan');
// const debug = require('debug')('testing');
//
// const logger = require('../src');
//
// const ringbuffer = new RingBuffer({ limit: 100 });
//
// logger.addStream({
//   level: 'trace',
//   type: 'raw', // use 'raw' to get raw log record objects
//   stream: ringbuffer
// });
//
// debug(logger);
// debug(logger.level());
//
// const log = logger('tester');
// debug(log);
//
// log('hello world');
// log('Or is this me');
//
//
// const _debug = logger('debug', 'debug');
// _debug('What', 'debug');
//
// debug(ringbuffer.records);
