/* global assert */

window.promise_test = async (fn, name) => {
  const cleanups = [];
  const testCase = {
    name,
    add_cleanup(fn) {
      cleanups.push(fn);
    },
  };
  it(name, async () => {
    await fn(testCase);
    for (const cleanup of cleanups) {
      cleanup();
    }
  });
};

window.promise_rejects_js = async (testCase, expectedError, promise) => {
  try {
    await promise;
  } catch (error) {
    if (error.name !== expectedError.name) {
      assert.fail(
        `${testCase.name}: Promise rejected with ${error.name}, expected ${expectedError.name}`
      );
    }
    return;
  }
  assert.fail(`${testCase.name}: Promise didn't reject when it should have.`);
};

window.assert_equals = assert.equal;
