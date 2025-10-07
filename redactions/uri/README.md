# @harrytwright/logger-redactions-uri

A [`CVE-2020-7661`](https://github.com/advisories/GHSA-v4rh-8p82-6h5w) safe version of [`zeke/redact-url`](https://github.com/zeke/redact-url).

## Usage

```javascript
const logger = require("@harrytwright/logger");
logger.redactions(require("@harrytwright/logger-redactions-uri"));
```

Or adding `@harrytwright/logger` and `redactions` to your `package.json`:

```json
{
  "name": "package",
  "scripts": {
    ...
  },
  "dependency": {
    "@harrytwright/logger-redactions-uri": "1.0.0"
  },
  "@harrytwright/logger": {
    "redactions": [
      "@harrytwright/logger-redactions-uri"
    ]
  }
}

```
