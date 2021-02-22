/* global assert */

window.test = (fn, name) => {
  it(name, () => {
    fn();
  });
};

window.promise_test = async (fn, name) => {
  const cleanups = [];
  const testCase = {
    name,
    add_cleanup(fn) {
      cleanups.push(fn);
    },
  };
  it(name, async () => {
    try {
      await fn(testCase);
    } finally {
      for (const cleanup of cleanups) {
        cleanup();
      }
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
window.assert_true = assert.ok;
window.assert_not_equals = assert.notEqual;
window.assert_array_equals = assert.deepEqual;
