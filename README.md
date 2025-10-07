# @harrytwright/logger

[![Node.js CI](https://github.com/harrytwright/logger/actions/workflows/ci.js.yml/badge.svg)](https://github.com/harrytwright/logger/actions/workflows/ci.js.yml)
[![CI - @harrytwright/logger-redactions-*](https://github.com/harrytwright/logger/actions/workflows/redactions.js.yml/badge.svg)](https://github.com/harrytwright/logger/actions/workflows/redactions.js.yml)

Logger is a striped [`npmlog`](https://github.com/npm/npmlog) clone, for personal usage. Removing all deps

```javascript
import logger from "@harrytwright/logger";

logger.http("application", "Hello World");
```

## Acknowledgments

- [`zeke/redact-url`](https://github.com/zeke/redact-url/blob/master/index.js) For the redaction code, see [docs](/redactions/uri) for this
- [`npm/npmlog`](https://github.com/npm/npmlog) For the template for the simple logging
