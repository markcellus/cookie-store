/* global expect */

import {cookieStore, CookieStore, CookieChangeEvent} from '../dist/index.js'

window.cookieStore = cookieStore
window.CookieStore = CookieStore
window.CookieChangeEvent = CookieChangeEvent

describe('Cookie Store', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
    });
  });
  afterEach(() => {
    document.cookie = '';
  });

  it('is a class, instanceof CookieStore', () => {
    expect(window.cookieStore).to.be.instanceof(window.CookieStore);
  });

  it('is an instanceof EventTarget', () => {
    expect(window.cookieStore).to.be.instanceof(window.EventTarget);
  });

  it('has a toStringTag of CookieStore', () => {
    expect(window.cookieStore[Symbol.toStringTag]).to.equal('CookieStore');
  });

  it('cannot be constructed', () => {
    expect(() => new window.CookieStore()).to.throw(TypeError, 'Illegal');
  });

  describe('get', () => {
    it('returns cookie matching supplied name', async () => {
      const foo = 'foo';
      const bar = 'bar';
      document.cookie = `${foo}=${bar}`;
      const result = await window.cookieStore.get(foo);
      expect(result).to.deep.equal({ name: foo, value: bar });
    });
    it('returns undefined when no cookie is found', async () => {
      const foo = 'foo';
      const bar = 'bar';
      document.cookie = `${foo}=${bar}`;
      const result = await window.cookieStore.get(bar);
      expect(result).to.deep.equal(undefined);
    });
  });
  describe('getAll', () => {
    it('returns an array with all cookies if no name is provided', async () => {
      const foo = 'foo';
      const bar = 'bar';
      const baz = 'baz';
      document.cookie = `${foo}=${bar}; ${bar}=${baz}`;
      const result = await window.cookieStore.getAll();
      expect(result).to.deep.equal([
        { name: foo, value: bar },
        { name: bar, value: baz },
      ]);
    });
    it('returns an array with cookies that match name', async () => {
      const foo = 'foo';
      const bar = 'bar';
      const baz = 'baz';
      document.cookie = `${foo}=${bar}; ${bar}=${baz}`;
      const result = await window.cookieStore.getAll(bar);
      expect(result).to.deep.equal([{ name: bar, value: baz }]);
    });
    it('returns an empty when no matching cookies are found', async () => {
      const foo = 'foo';
      const bar = 'bar';
      const baz = 'baz';
      document.cookie = `${foo}=${bar}; ${bar}=${baz}`;
      const result = await window.cookieStore.getAll(baz);
      expect(result).to.deep.equal([]);
    });
  });
});
