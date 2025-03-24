export const isObject = (t: unknown): t is Record<string, unknown> =>
  typeof t === 'object' && !Array.isArray(t) && t !== null;

export const interpretPath = (pointer: string) => {
  const paths = pointer.split('/').map(unescapeToken);
  return {
    pointer,
    paths,
    parent: paths.length >= 2 ? paths[paths.length - 2] : '',
    key: paths.length > 1 ? paths[paths.length - 1] : '',
  };
};

// Excerpt from RFC6901/5 <https://datatracker.ietf.org/doc/html/rfc6901#section-5>
//
// Here, we need to be careful with the edge case "~01". The order of substitution matters
// here, as we if substitute "~0" first, then the sequence will become "~01" -> "~1" -> "/".
// Substituting "~1" first will result in "~01" -> "~01" -> "~1".
//
// > Note that before processing a JSON string as a JSON Pointer,
// > backslash escape sequences must be unescaped.
export const unescapeToken = (str: string) => str.replace(/~1/g, '/').replace(/~0/g, '~');
