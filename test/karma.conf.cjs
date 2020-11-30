module.exports = function (config) {
  config.set({
    files: [
      { pattern: '../dist/index.js', type: 'module' },
      { pattern: './*.tests.js', type: 'module' }
    ],
    plugins: ['karma-*'],
    reporters: ['progress'],
    frameworks: ['mocha', 'chai'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['FirefoxHeadless'],
    concurrency: Infinity,
  });
};
