import { isObject, interpretPath } from './helpers.js';
import { JSONObject } from './types.js';

// Escape JSON Pointer string token part
//
// Excerpt from RFC6901 <https://datatracker.ietf.org/doc/html/rfc6901>
//
// > Because the characters '~' (%x7E) and '/' (%x2F) have special
// > meanings in JSON Pointer, '~' needs to be encoded as '~0' and '/'
// > needs to be encoded as '~1' when these characters appear in a
// > reference token.
export const escapeToken = (str: string) => str.replace(/~/g, '~0').replace(/\//g, '~1');

export const evaluate = (object: JSONObject, pointer: string) => {
  const { paths } = interpretPath(pointer);

  if (!isObject(object)) throw new Error(`The root object is not a valid JSON object.`);

  // Each JSON Pointer MUST begin with '/', otherwise we deem it invalid.
  //
  // > A JSON Pointer is a Unicode string (see [RFC4627], Section 3)
  // > containing a sequence of zero or more reference tokens, each prefixed
  // > by a '/' (%x2F) character.
  if (paths[0] !== '') throw new Error(`Invalid JSON Pointer: ${pointer}`);

  if (paths.length === 1) return object;

  // Implements `Evaluation` logic from RFC6901
  return paths.slice(1).reduce((acc, token, _) => {
    if (!acc) throw new Error(`Unable to resolve pointer: ${pointer}`);

    if (Array.isArray(acc)) {
      if (token === '-') {
        // > [T]he use of the "-" character to index an array will always
        // > result in such an error condition because by definition it refers to
        // > a nonexistent array element.  Thus, applications of JSON Pointer need
        // > to specify how that character is to be handled, if it is to be
        // > useful.
        //
        // Observation: If currently referenced value is an array, rfc6901
        // requires the reference token to be either a digit or `-`. Interestingly,
        // `-` will always result in an error condition by default. It is up to the application's
        // implementation to determine how to handle this non-existent element. In this case,
        // `-` will raise an error.
        throw new Error(`Invalid reference: '-' points to a non-existent array element.`);
      }

      // > [C]haracters comprised of digits (see ABNF below; note that
      // > leading zeros are not allowed) that represent an unsigned
      // > base-10 integer value, making the new referenced value the
      // > array element with the zero-based index identified by the
      // > token,...
      if (!/^\d+$/.test(token)) {
        throw new Error(`Invalid array index: ${token}`);
      }

      const index = parseInt(token, 10);

      if (index >= acc.length) throw new Error(`Array index out of bounds: ${index}`);

      return acc[index];
    }

    // > If the currently referenced value is a JSON object, the new
    // > referenced value is the object member with the name identified by
    // > the reference token.  The member name is equal to the token if it
    // > has the same number of Unicode characters as the token and their
    // > code points are byte-by-byte equal.  No Unicode character
    // > normalization is performed.  If a referenced member name is not
    // > unique in an object, the member that is referenced is undefined,
    // > and evaluation fails
    if (isObject(acc)) {
      if (!Object.hasOwn(acc, token)) throw new Error(`Key not found: ${token}`);

      return acc[token];
    }

    throw new Error(`Cannot resolve token '${token}' in non-object, non-array value.`);
  }, object);
};
