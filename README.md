# @harrytwright/logger

[![Node.js CI](https://github.com/harrytwright/Logger/actions/workflows/node.js.yml/badge.svg)](https://github.com/harrytwright/Logger/actions/workflows/node.js.yml)

Logger is a striped [`npmlog`](https://github.com/npm/npmlog) clone, for personal usage. Removing all deps

```javascript
import logger from '@harrytwright/logger';

logger.http('application', 'Hello World');
```

## Acknowledgments

- [`zeke/redact-url`](https://github.com/zeke/redact-url/blob/master/index.js) For the redaction code
  > This may be removed in the future to be set via an optional dependency if is exists
- [`npm/npmlog`](https://github.com/npm/npmlog) For the template for the simple logging
