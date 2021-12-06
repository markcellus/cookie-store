/* global assert */
import {cookieStore, CookieStore, CookieChangeEvent} from '../../dist/index.js';

window.cookieStore = cookieStore;
window.CookieStore = CookieStore;
window.CookieChangeEvent = CookieChangeEvent;

self.GLOBAL = {
  isWindow: () => true,
  isWorker: () => false,
};

window.test = (fn, name) => {
  it(name, () => {
    fn();
  });
};

const skippedTests = [
  // We are using `document.cookie` as data store for cookies. The path
  // property is not included in the data when we get from said store.
  'cookieStore.set adds / to path that does not end with /',
];

window.promise_test = async (fn, name) => {
  const cleanups = [];
  const testCase = {
    name,
    add_cleanup(fn) {
      cleanups.push(fn);
    },
  };
  async function test() {
    try {
      await fn(testCase);
    } finally {
      for (const cleanup of cleanups) {
        cleanup();
      }
    }
  }
  it(name, skippedTests.includes(name) ? undefined : test);
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

function service_worker_unregister(test, scope) {
  var absoluteScope = new URL(scope, window.location).href;
  return navigator.serviceWorker
    .getRegistration(scope)
    .then(function (registration) {
      if (registration && registration.scope === absoluteScope)
        return registration.unregister();
    });
  //.catch(() => assert.fail('unregister should not fail'));
}

function service_worker_unregister_and_register(test, url, scope, options) {
  if (!scope || scope.length == 0)
    return Promise.reject(new Error('tests must define a scope'));

  if (options && options.scope)
    return Promise.reject(new Error('scope must not be passed in options'));

  options = Object.assign({ scope: scope }, options);
  return service_worker_unregister(test, scope).then(function () {
    return navigator.serviceWorker.register(url, options);
  });
  //.catch(() => assert.fail('unregister and register should not fail'));
}

window.wait_for_state = function (test, worker, state) {
  if (!worker || worker.state == undefined) {
    return Promise.reject(
      new Error('wait_for_state needs a ServiceWorker object to be passed.')
    );
  }
  if (worker.state === state) return Promise.resolve(state);

  if (is_state_advanced(worker.state, state)) {
    return Promise.reject(
      new Error(
        `Waiting for ${state} but the worker is already ${worker.state}.`
      )
    );
  }
  return new Promise(function (resolve, reject) {
    worker.addEventListener('statechange', function () {
      if (worker.state === state) resolve(state);

      if (is_state_advanced(worker.state, state)) {
        reject(
          new Error(
            `The state of the worker becomes ${worker.state} while waiting` +
              `for ${state}.`
          )
        );
      }
    });
  });
};

function is_state_advanced(state_a, state_b) {
  if (state_b === 'installing') {
    switch (state_a) {
      case 'installed':
      case 'activating':
      case 'activated':
      case 'redundant':
        return true;
    }
  }

  if (state_b === 'installed') {
    switch (state_a) {
      case 'activating':
      case 'activated':
      case 'redundant':
        return true;
    }
  }

  if (state_b === 'activating') {
    switch (state_a) {
      case 'activated':
      case 'redundant':
        return true;
    }
  }

  if (state_b === 'activated') {
    switch (state_a) {
      case 'redundant':
        return true;
    }
  }
  return false;
}

window.service_worker_unregister_and_register = service_worker_unregister_and_register;
window.assert_equals = assert.equal;
window.assert_true = assert.ok;
window.assert_not_equals = assert.notEqual;
window.assert_array_equals = assert.deepEqual;
