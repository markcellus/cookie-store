# `cookie-store`

[![Build Status](https://travis-ci.org/markcellus/cookie-store.svg?branch=master)](https://travis-ci.org/markcellus/cookie-store)
[![npm version](https://badge.fury.io/js/cookie-store.svg)](https://www.npmjs.com/package/cookie-store)

A speculative polyfill to allow use of the [Cookie Store API](https://wicg.github.io/cookie-store/) in modern browsers that don't support it natively, including IE11. Also compatible with TypeScript.

:warning: **EXPERIMENTAL:** _The Cookie Store API is not a W3C standard yet and the final implementation may differ from the current API of this polyfill._

## Installation

```sh
npm install cookie-store
```

Or, if you prefer to use an upcoming version of the package with more features (and closer to the final specification). Install the latest `next` version of the package. See the README on the [`next` branch](https://github.com/markcellus/cookie-store/tree/next) for the updated API.

```
npm install cookie-store@next
```

## Basic Example

```js
// import polyfill and declare types
import 'cookie-store';

// set a cookie
await cookieStore.set('forgive', 'me');
// get a cookie
const foo = await cookieStore.get('forgive');
console.log(foo); // { name: 'forgive', value: 'me' }

// set another cookie
await cookieStore.set('forget', 'it');

// get multiple cookies
const cookies = await cookieStore.getAll();
console.log(cookies); // [{ name: 'forgive', value: 'me' }, { name: 'forget', value: 'it' }]

// delete a cookie
await cookieStore.delete('forget');
```
