Logger is a **simple and easy to use bunyan middleman**:

```javascript
import logger from 'logger';

const log = logger('http:application');
log('Hello World');
```

# Current Status

Working. Currently as of now the logger is basic so it works, as long as no major bunyan updates as of now we will work.

## Future

1) Multi logging tool support
2) Redis Buffer
3) Stream Support

# Installation

```
npm install @harrytwright/logger
```

# Log Method

The standard usage of logger is to call it like so:

### ES6

```javascript
import logger from 'logger';

const log = logger('http:application');
log('Hello World');

// OR

log.info('Hello World');
```

### Require

```javascript
const logger = require('logger')('http:application');
logger('Hello World');

// OR

logger.info('Hello World')
```

## Setting custom levels

> Due to the nature of how the framework is laid out as of now this is not available when setting a global change...

```javascript
import logger from 'logger';

// Adding the extra option tells the bunyan child it can work with debug calls
const log = logger('debug:http:application', 'debug');
log('Hello World', 'debug');
```

## Setting custom streams

> Due to the nature of how the framework is laid out as of now this is not available when setting a global change...

```javascript
import logger from 'logger';
import { RingBuffer } from 'bunyan';

// Adding the extra option tells the bunyan child it can work with debug calls
const ringbuffer = new RingBuffer({ limit: 100 });
const log = logger('debug:http:application', 'debug', {
  streams: [
    {
      level: 'trace',
      type: 'raw', // use 'raw' to get raw log record objects
      stream: ringbuffer
    }
  ]
});

log('What', 'debug');
console.log(ringbuffer.records);
```
