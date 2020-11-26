module.exports = function (config) {
  config.set({
    files: [{ pattern: '**/*.tests.ts', type: 'module' }],

    plugins: [require.resolve('@open-wc/karma-esm'), 'karma-*'],
    esm: {
      nodeResolve: true,
      compatibility: 'min',
      fileExtensions: ['.ts'],
      babel: true,
    },
    coverageReporter: {
      includeAllSources: true,
      reporters: [{ type: 'lcov', subdir: '.' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'coverage'],
    frameworks: ['esm', 'mocha', 'chai'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    concurrency: Infinity,
  });
};
