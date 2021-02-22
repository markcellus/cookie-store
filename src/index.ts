const decode = decodeURIComponent;
const pairSplitRegExp = /; */;

// Try decoding a string using a decoding function.
function tryDecode(
  str: string,
  decode: ((encodedURIComponent: string) => string) | boolean
): string {
  try {
    return typeof decode === 'boolean' ? decodeURIComponent(str) : decode(str);
  } catch (e) {
    return str;
  }
}

type CookieMatchType = 'equals';

interface Cookie {
  domain?: string;
  expires?: number;
  name: string;
  path?: string;
  secure?: boolean;
  sameSite?: CookieSameSite;
  value: string;
}

interface CookieStoreDeleteOptions {
  name: string;
  domain?: string;
  path?: string;
}

interface CookieStoreGetOptions {
  name?: string;
  url?: string;
  matchType?: CookieMatchType;
}

interface ParseOptions {
  decode?: boolean;
}

enum CookieSameSite {
  strict = 'strict',
  lax = 'lax',
  none = 'none',
}

interface CookieInit {
  name: string;
  value: string;
  expires?: Date | number;
  domain?: string;
  path: string;
  sameSite: CookieSameSite;
}

interface CookieListItem {
  name?: string;
  value?: string;
  domain?: string;
  path?: string;
  expires?: number;
  secure?: boolean;
  sameSite?: CookieSameSite;
}

type DeletedCookieListItem = CookieListItem & {
  value: undefined;
};

type CookieList = CookieListItem[];
type DeletedCookieList = DeletedCookieListItem[];

interface CookieChangeEventInit extends EventInit {
  changed: CookieList;
  deleted: DeletedCookieList;
}

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @private
 */

function parse(str: string, options: ParseOptions = {}): Cookie[] {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  const obj = [];
  const opt = options || {};
  const pairs = str.split(pairSplitRegExp);
  const dec = opt.decode || decode;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    let eqIdx = pair.indexOf('=');

    // skip things that don't look like key=value
    if (eqIdx < 0) {
      continue;
    }

    const key = pair.substr(0, eqIdx).trim();
    let val = pair.substr(++eqIdx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (undefined == obj[key]) {
      obj.push({
        name: key,
        value: tryDecode(val, dec),
      });
    }
  }

  return obj;
}

class CookieChangeEvent extends Event {
  changed: CookieList;
  deleted: DeletedCookieList;

  constructor(
    type: string,
    eventInitDict: CookieChangeEventInit = { changed: [], deleted: [] }
  ) {
    super(type, eventInitDict);
    this.changed = eventInitDict.changed;
    this.deleted = eventInitDict.deleted;
  }
}

class CookieStore extends EventTarget {
  onchange?: (event: CookieChangeEvent) => void;

  get [Symbol.toStringTag]() {
    return 'CookieStore';
  }

  constructor() {
    super();
    throw new TypeError('Illegal Constructor');
  }

  /**
   * Get a cookie.
   *
   * @param {string} name
   * @return {Promise}
   */
  async get(
    init?: CookieStoreGetOptions['name'] | CookieStoreGetOptions
  ): Promise<Cookie | undefined> {
    if (init == null) {
      throw new TypeError('CookieStoreGetOptions must not be empty');
    } else if (init instanceof Object && !Object.keys(init).length) {
      throw new TypeError('CookieStoreGetOptions must not be empty');
    }
    return (await this.getAll(init))[0];
  }

  async set(init: CookieInit | string, possibleValue?: string): Promise<void> {
    const item: CookieListItem = {
      name: '',
      value: '',
      path: '/',
      secure: false,
      sameSite: CookieSameSite.strict,
    };
    if (typeof init === 'string') {
      item.name = init as string;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      item.value = possibleValue!;
    } else {
      Object.assign(item, init);

      if (item.path && !item.path.startsWith('/')) {
        throw new TypeError('Cookie path must start with "/"');
      }
      if (item.domain?.startsWith('.')) {
        throw new TypeError('Cookie domain cannot start with "."');
      }
      if (item.domain && item.domain !== window.location.hostname) {
        throw new TypeError('Cookie domain must domain-match current host');
      }
      if (item.name === '' && item.value && item.value.includes('=')) {
        throw new TypeError(
          "Cookie value cannot contain '=' if the name is empty"
        );
      }

      if (item.path && item.path.endsWith('/')) {
        item.path = item.path.slice(0, -1);
      }
      if (item.path === '') {
        item.path = '/';
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let cookieString = `${item.name}=${encodeURIComponent(item.value!)}`;

    if (item.domain) {
      cookieString += '; Domain=' + item.domain;
    }

    if (item.path && item.path !== '/') {
      cookieString += '; Path=' + item.path;
    }

    if (typeof item.expires === 'number') {
      cookieString += '; Expires=' + new Date(item.expires).toUTCString();
    }

    if (item.secure) {
      cookieString += '; Secure';
    }

    switch (item.sameSite) {
      case CookieSameSite.lax:
        cookieString += '; SameSite=Lax';
        break;
      case CookieSameSite.strict:
        cookieString += '; SameSite=Strict';
        break;
      case CookieSameSite.none:
        cookieString += '; SameSite=None';
        break;
    }

    const previousCookie = this.get(item);
    document.cookie = cookieString;

    if (this.onchange) {
      const changed = [];
      const deleted = [];

      if (previousCookie && !(await this.get(item))) {
        deleted.push({ ...item, value: undefined });
      } else {
        changed.push(item);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const event = new CookieChangeEvent('change', { changed, deleted });
      this.onchange(event);
    }
  }

  /**
   * Get multiple cookies.
   */
  async getAll(
    init?: CookieStoreGetOptions['name'] | CookieStoreGetOptions
  ): Promise<Cookie[]> {
    const cookies = parse(document.cookie);
    if (!init || Object.keys(init).length === 0) {
      return cookies;
    }
    if (init == null) {
      throw new TypeError('CookieStoreGetOptions must not be empty');
    } else if (init instanceof Object && !Object.keys(init).length) {
      throw new TypeError('CookieStoreGetOptions must not be empty');
    }
    let name: string | undefined;
    let url;
    if (typeof init === 'string') {
      name = init as string;
    } else {
      name = init.name;
      url = init.url;
    }
    if (url) {
      const parsedURL = new URL(url, window.location.origin);
      if (
        window.location.href !== parsedURL.href ||
        window.location.origin !== parsedURL.origin
      ) {
        throw new TypeError('URL must match the document URL');
      }
      return cookies.slice(0, 1);
    }
    return cookies.filter((cookie) => cookie.name === name);
  }

  /**
   * Remove a cookie.
   *
   * @param {String} name
   * @return {Promise}
   */
  async delete(
    init: CookieStoreDeleteOptions['name'] | CookieStoreDeleteOptions
  ): Promise<void> {
    const item: CookieListItem = {
      name: '',
      value: '',
      path: '/',
      secure: false,
      sameSite: CookieSameSite.strict,
    };
    if (typeof init === 'string') {
      item.name = init as string;
    } else {
      Object.assign(item, init);
    }

    item.expires = 0;

    await this.set(item);
  }
}

if (!window.cookieStore) {
  window.CookieStore = CookieStore;
  window.cookieStore = Object.create(CookieStore.prototype);
  window.CookieChangeEvent = CookieChangeEvent;
}

declare global {
  interface Window {
    CookieStore: typeof CookieStore;
    cookieStore: CookieStore;
    CookieChangeEvent: typeof CookieChangeEvent;
  }
}

export {};
