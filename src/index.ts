/**
 * Module variables.
 * @private
 */

const decode = decodeURIComponent;
const encode = encodeURIComponent;
const pairSplitRegExp = /; */;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

// eslint-disable-next-line no-control-regex
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */
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

type CookieSameSite = 'no_restriction' | 'lax' | 'strict';
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

interface SerializeOptions {
  encode?: boolean;
  maxAge?: number;
  domain?: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | string;
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

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @private
 */

function serialize(
  name: string,
  val: string,
  options: SerializeOptions = {}
): string {
  const opt = options || {};
  const enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid');
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid');
  }

  const value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid');
  }

  let str = name + '=' + value;

  if (null != opt.maxAge) {
    const maxAge = opt.maxAge - 0;
    if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }

    str += '; Expires=' + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.sameSite) {
    const sameSite =
      typeof opt.sameSite === 'string'
        ? opt.sameSite.toLowerCase()
        : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      case 'none':
        str += '; SameSite=None';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }

  return str;
}

function sanitizeOptions<T>(arg: string | T): T {
  if (typeof arg === 'string') {
    return ({ name: arg } as unknown) as T;
  }
  return arg;
}

const CookieStore = {
  /**
   * Get a cookie.
   *
   * @param {string} name
   * @return {Promise}
   */
  async get(
    options?: CookieStoreGetOptions['name'] | CookieStoreGetOptions
  ): Promise<Cookie | undefined> {
    if (!options || !Object.keys(options).length) {
      throw new TypeError('CookieStoreGetOptions must not be empty');
    }
    const { name, url } = sanitizeOptions<CookieStoreGetOptions>(options);
    if (url) {
      const parsedURL = new URL(url, window.location.origin);
      if (
        window.location.href !== parsedURL.href ||
        window.location.origin !== parsedURL.origin
      ) {
        throw new TypeError('URL must match the document URL');
      }
      return parse(document.cookie)[0];
    }
    return parse(document.cookie).find((cookie) => cookie.name === name);
  },

  /**
   * Set a cookie.
   *
   * @param {string} name
   * @param {string} value
   * @return {Promise}
   */
  set(name: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const cookieString = serialize(name, value);
        document.cookie = cookieString;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Get multiple cookies.
   */
  async getAll(
    options?: CookieStoreGetOptions['name'] | CookieStoreGetOptions
  ): Promise<Cookie[]> {
    if (!options) {
      return parse(document.cookie);
    }
    const { name } = sanitizeOptions<CookieStoreGetOptions>(options);
    const cookie = await this.get(name);
    return cookie ? [cookie] : [];
  },

  /**
   * Remove a cookie.
   *
   * @param {String} name
   * @return {Promise}
   */
  async delete(
    options: CookieStoreDeleteOptions['name'] | CookieStoreDeleteOptions
  ): Promise<void> {
    const { name, domain } = sanitizeOptions<CookieStoreDeleteOptions>(options);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { value } = (await this.get(name))!;
    const serializedValue = serialize(name, value, {
      maxAge: 0,
      domain,
    });
    document.cookie = serializedValue;
    return Promise.resolve();
  },
};

if (!window.cookieStore) {
  window.cookieStore = CookieStore;
}

declare global {
  interface Window {
    cookieStore: typeof CookieStore;
  }
}

export {};
