import './index';
import 'chai/chai';

const { expect } = window.chai;

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
  describe('get', () => {
    it('returns cookie matching supplied name', async () => {
      const foo = 'foo';
      const bar = 'bar';
      document.cookie = `${foo}=${bar}`;
      const result = await window.cookieStore.get(foo);
      expect(result).to.deep.equal({ name: foo, value: bar });
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
  });
  describe('set', () => {
    it('updates document.cookie with supplied value', async () => {
      await window.cookieStore.set('foo', 'bar');
      expect(document.cookie).to.equal('foo=bar');
    });
  });
  describe('delete', () => {
    it('sets max age to 0 on cookie that matches supplied name', async () => {
      document.cookie = 'foo=bar';
      await window.cookieStore.delete('foo');
      expect(document.cookie).to.equal('foo=bar; Max-Age=0; Path=/');
    });
  });
});
