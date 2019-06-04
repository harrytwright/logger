require('./common');
const logger = require('../dist');

const newLogger = new logger.Logger('Tester')('loggie');
newLogger('hello world');
newLogger('Or is this me');
newLogger('Oh Shit an error', new Error('Nice one bruva'), 'error');

const log = logger('tester');
log('hello world');
log('Or is this me');


setTimeout(() => process.exit(1), 1000);
