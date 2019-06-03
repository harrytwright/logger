Logger is a **simple and easy to use logger middleman**:

```javascript
import logger from 'logger';

const log = logger('http:application');
log('Hello World');
```

> As of 1.x.x [Bunyan](https://github.com/trentm/node-bunyan) is the only logger used.

# Current Status

Working. Currently as of now the logger is basic so it works, as long as no major bunyan updates as of now we will work.

## Future

1) Multi logging tool support
2) Redis Buffer
3) Stream Support

# Installation

```
npm install logger git+https://git@github.com/harrytwright/Logger.git
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
logger('Hello World')

// OR

logger.info('Hello World')
```
