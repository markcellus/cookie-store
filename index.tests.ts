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
      document.cookie = 'foo=bar';
      const foo = await window.cookieStore.get('foo');
      expect(foo).to.equal('bar');
    });
  });
  describe('set', () => {
    it('updates document.cookie with supplied value', async () => {
      await window.cookieStore.set('foo', 'bar');
      expect(document.cookie).to.equal('foo=bar');
    });
  });
});
