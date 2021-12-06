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
}

interface ParseOptions {
  decode?: boolean;
}

enum CookieSameSite {
  strict = 'strict',
  lax = 'lax',
  none = 'none',
}

interface CookieListItem {
  name?: string;
  value?: string;
  domain: string | null;
  path?: string;
  expires: Date | number | null;
  secure?: boolean;
  sameSite?: CookieSameSite;
}

type CookieList = CookieListItem[];

interface CookieChangeEventInit extends EventInit {
  changed: CookieList;
  deleted: CookieList;
}

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
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
  deleted: CookieList;

  constructor(
    type: string,
    eventInitDict: CookieChangeEventInit = { changed: [], deleted: [] }
  ) {
    super(type, eventInitDict);
    this.changed = eventInitDict.changed || [];
    this.deleted = eventInitDict.deleted || [];
  }
}

class CookieStore extends EventTarget {
  onchange?: (event: CookieChangeEvent) => void;

  get [Symbol.toStringTag](): 'CookieStore' {
    return 'CookieStore';
  }

  constructor() {
    super();
    throw new TypeError('Illegal Constructor');
  }

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

  async set(
    init: CookieListItem | string,
    possibleValue?: string
  ): Promise<void> {
    const item: CookieListItem = {
      name: '',
      value: '',
      path: '/',
      secure: false,
      sameSite: CookieSameSite.strict,
      expires: null,
      domain: null,
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

      if (item.name?.startsWith('__Host') && item.domain) {
        throw new TypeError(
          'Cookie domain must not be specified for host cookies'
        );
      }
      if (item.name?.startsWith('__Host') && item.path != '/') {
        throw new TypeError(
          'Cookie path must not be specified for host cookies'
        );
      }

      if (item.path && item.path.endsWith('/')) {
        item.path = item.path.slice(0, -1);
      }
      if (item.path === '') {
        item.path = '/';
      }
    }

    if (item.name === '' && item.value && item.value.includes('=')) {
      throw new TypeError(
        "Cookie value cannot contain '=' if the name is empty"
      );
    }

    if (item.name && item.name.startsWith('__Host')) {
      item.secure = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let cookieString = `${item.name}=${encodeURIComponent(item.value!)}`;

    if (item.domain) {
      cookieString += '; Domain=' + item.domain;
    }

    if (item.path) {
      cookieString += '; Path=' + item.path;
    }

    if (typeof item.expires === 'number') {
      cookieString += '; Expires=' + new Date(item.expires).toUTCString();
    } else if (item.expires instanceof Date) {
      cookieString += '; Expires=' + item.expires.toUTCString();
    }

    if ((item.name && item.name.startsWith('__Secure')) || item.secure) {
      item.sameSite = CookieSameSite.lax;
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

  async getAll(
    init?: CookieStoreGetOptions['name'] | CookieStoreGetOptions
  ): Promise<Cookie[]> {
    const cookies = parse(document.cookie);
    if (init == null || Object.keys(init).length === 0) {
      return cookies;
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

  async delete(
    init: CookieStoreDeleteOptions['name'] | CookieStoreDeleteOptions
  ): Promise<void> {
    const item: CookieListItem = {
      name: '',
      value: '',
      path: '/',
      secure: false,
      sameSite: CookieSameSite.strict,
      expires: null,
      domain: null,
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

interface CookieStoreGetOptions {
  name?: string;
  url?: string;
}

const workerSubscriptions = new WeakMap<
  CookieStoreManager,
  CookieStoreGetOptions[]
>();

const registrations = new WeakMap<
  CookieStoreManager,
  ServiceWorkerRegistration
>();

class CookieStoreManager {
  get [Symbol.toStringTag]() {
    return 'CookieStoreManager';
  }

  constructor() {
    throw new TypeError('Illegal Constructor');
  }

  async subscribe(subscriptions: CookieStoreGetOptions[]): Promise<void> {
    const currentSubcriptions = workerSubscriptions.get(this) || [];
    const worker = registrations.get(this);
    if (!worker) throw new TypeError('Illegal invocation');
    for (const subscription of subscriptions) {
      const name = subscription.name;
      const url = new URL(subscription.url || '', worker.scope).toString();

      if (currentSubcriptions.some((x) => x.name === name && x.url === url))
        continue;
      currentSubcriptions.push({
        name: subscription.name,
        url,
      });
    }
    workerSubscriptions.set(this, currentSubcriptions);
  }

  async getSubscriptions(): Promise<CookieStoreGetOptions[]> {
    return (workerSubscriptions.get(this) || []).map(({ name, url }) => ({
      name,
      url,
    }));
  }

  async unsubscribe(subscriptions: CookieStoreGetOptions[]): Promise<void> {
    let currentSubcriptions = workerSubscriptions.get(this) || [];

    const worker = registrations.get(this);
    if (!worker) throw new TypeError('Illegal invocation');

    for (const subscription of subscriptions) {
      const name = subscription.name;
      // TODO: Parse the url with the relevant settings objects API base URL.
      // https://wicg.github.io/cookie-store/#CookieStoreManager-unsubscribe
      const url = new URL(subscription.url || '', worker.scope).toString();
      currentSubcriptions = currentSubcriptions.filter((x) => {
        if (x.name !== name) return true;
        if (x.url !== url) return true;
        return false;
      });
    }
    workerSubscriptions.set(this, currentSubcriptions);
  }
}

if (!ServiceWorkerRegistration.prototype.cookies) {
  Object.defineProperty(ServiceWorkerRegistration.prototype, 'cookies', {
    configurable: true,
    enumerable: true,
    get() {
      const manager = Object.create(CookieStoreManager.prototype);
      registrations.set(manager, this);
      Object.defineProperty(this, 'cookies', { value: manager });
      return manager;
    },
  });
}

declare global {
  interface Window {
    CookieStore: typeof CookieStore;
    cookieStore: CookieStore;
    CookieChangeEvent: typeof CookieChangeEvent;
    CookieStoreManager: typeof CookieStoreManager;
  }
  interface ServiceWorkerRegistration {
    cookies: CookieStoreManager;
  }
}

const cookieStore = Object.create(CookieStore.prototype);
export { cookieStore, CookieStore, CookieChangeEvent };
