# `cookie-store`

[![Build Status](https://travis-ci.org/mkay581/cookie-store.svg?branch=master)](https://travis-ci.org/mkay581/cookie-store)
[![npm version](https://badge.fury.io/js/cookie-store.svg)](https://www.npmjs.com/package/cookie-store)

A polyfill to allow use of the [Cookie Store API](https://wicg.github.io/cookie-store/) in modern browsers that don't support it natively, including IE11. Also compatible with TypeScript.

## Installation

```sh
npm install cookie-store
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
console.log(obj); // [{ name: 'forgive', value: 'me' }, { name: 'forget', value: 'it' }]

// delete a cookie
await cookieStore.delete('forget');
```
