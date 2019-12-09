require('./common');
const logger = require('../src');

const newLogger = new logger.Logger('Tester')('loggie');
newLogger('hello world');
newLogger('Or is this me');
newLogger('Oh Shit an error', new Error('Nice one bruva'), 'error');

const log = logger('tester');
log('hello world');
log('Or is this me');

setTimeout(() => {
  const internalLog = new logger.Logger('DB')('test');
  internalLog('Throwing an error', new Error('Wow'), 'error');

  process.exit(1);
}, 500);
