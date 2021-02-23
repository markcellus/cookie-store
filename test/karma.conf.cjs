module.exports = function (config) {
  config.set({
    files: [
      // Include the compiled library
      { pattern: '../dist/index.js', type: 'module' },
      // Set up test environment to be able to run WPT tests
      { pattern: './wpt-setup/*.js', type: 'module' },
      // Our tests
      { pattern: './index.tests.js', type: 'module' },
      // Web Platform Tests
      { pattern: './wpt/*.js', type: 'module' },
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
    urlRoot: '/test',
    singleRun: true,
  });
};
