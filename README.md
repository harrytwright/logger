Logger is a striped [`npmlog`](https://github.com/npm/npmlog) clone

```javascript
import logger from '@harrytwright/logger';

logger.http('application', 'Hello World');
```

# Current Status

> Due to removing bunyan everything works due to all in house

Working. Currently as of now the logger is basic.

## Roadmap

1) Multiple Streams
2) Formats
3) JSON output

# Installation

```
npm install @harrytwright/logger
```

# Log Method

The standard usage of logger is to call it like so:

### ES6

```javascript
import logger from '@harrytwright/logger';

logger.info('application', 'Hello World');
```

### Require

```javascript
const logger = require('@harrytwright/logger')
logger.info('application', 'Hello World');
```

## Setting custom levels

```javascript
import logger from '@harrytwright/logger';

logger.level = 'verbose'

// Adding the extra option tells the bunyan child it can work with debug calls
logger.verbose('application', 'Hello World');
```

## Setting custom streams

> Currently only one stream can be set per child log. So if you change the stream
> you are overwriting the original `process.stderr`.
>
> 2.X.X will address this

```javascript
import logger from '@harrytwright/logger';

logger.stream = TimingStream

logger.timing('application', 'Hello World');
```

## New Log

```javascript
import logger, { Log } from '@harrytwright/logger';

const log = new Log('MongoDB', 'info')
log.silly('application', 'Hello World');

// OR 

const log = new logger.Log('MongoDB', 'info')
log.silly('application', 'Hello World');
```
