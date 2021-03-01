module.exports = function (config) {
  config.set({
    basePath: '..',
    files: [
      // Include the compiled library
      { pattern: './dist/index.js', type: 'module' },
      // Include the compiled service worker polyfill
      { pattern: './dist/service-worker.js', included: false },
      // Set up test environment to be able to run WPT tests
      { pattern: './test/wpt-setup/*.js', type: 'module' },
      // Our tests
      { pattern: './test/index.tests.js', type: 'module' },
      // Web Platform Tests
      { pattern: './test/wpt/*.js', type: 'module' },
      // Resources
      { pattern: './test/resources/*', included: false },
    ],
    plugins: ['karma-*'],
    reporters: ['progress'],
    frameworks: ['mocha', 'chai'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['FirefoxHeadless'],
    concurrency: Infinity,
    hostname: 'foo.bar.localhost',
    urlRoot: '/cookie-store/',
    singleRun: true,
    proxies: {
      '/cookie-store/resources/': '/base/test/resources/',
    },
  });
};
