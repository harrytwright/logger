module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
      'logger.js',
      'test/bootstrap/index.js',
      'test/logging.test.js',
      'test/logging.browser.test.js'
    ],
    reporters: ['progress'],
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['HeadlessChrome'],
    customLaunchers: {
      HeadlessChrome: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 20000,
    singleRun: true
  })
}
