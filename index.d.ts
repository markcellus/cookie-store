/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 */
declare function parse(str: string, options?: any): any;
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
 */
declare function serialize(name: string, val: string, options?: any): string;
/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 */
declare function tryDecode(str: string, decode: Function): any;
declare function get(): void;
declare function set(): void;
declare function getAll(): void;
/**
 * Module variables.
 */
declare var decode: typeof decodeURIComponent;
declare var encode: typeof encodeURIComponent;
declare var pairSplitRegExp: RegExp;
/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */
declare var fieldContentRegExp: RegExp;
