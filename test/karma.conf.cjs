module.exports = function (config) {
  config.set({
    files: [
      { pattern: '../dist/index.js', type: 'module' },
      { pattern: './*.tests.js', type: 'module' }
    ],
    plugins: ['karma-*'],
    coverageReporter: {
      includeAllSources: true,
      reporters: [{ type: 'lcov', subdir: '.' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'coverage'],
    frameworks: ['mocha', 'chai'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    concurrency: Infinity,
  });
};
