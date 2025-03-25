import { describe, it, expect } from 'vitest';
import { evaluate } from './pointer.js';

describe('evaluate', () => {
  const sampleObject = {
    a: 1,
    b: { c: 2, d: [3, 4] },
    e: [5, { x: 'hello' }, [6, 7]],
  };

  it('returns the entire object when pointer is "" (empty path)', () => {
    const result = evaluate(sampleObject, '');
    expect(result).toEqual(sampleObject);
  });

  it('throws an error if the root is not an object', () => {
    expect(() => evaluate(42 as any, '/a')).toThrow('The root object is not a valid JSON object.');
    expect(() => evaluate(null as any, '/a')).toThrow('The root object is not a valid JSON object.');
    expect(() => evaluate(undefined as any, '/a')).toThrow('The root object is not a valid JSON object.');
  });

  it('throws an error if the pointer does not start with "/" (invalid pointer)', () => {
    expect(() => evaluate(sampleObject, 'noLeadingSlash')).toThrow(/Invalid JSON Pointer/);
  });

  it('throws an error if the pointer is "/"', () => {
    expect(() => evaluate(sampleObject, '/')).toThrowError(/Key not found: \"\"/i);
  });

  it('can retrieve a top-level property with "/a"', () => {
    const result = evaluate(sampleObject, '/a');
    expect(result).toBe(1);
  });

  it('can retrieve a nested object property with "/b/c"', () => {
    const result = evaluate(sampleObject, '/b/c');
    expect(result).toBe(2);
  });

  it('can retrieve an array element with "/b/d/1"', () => {
    const result = evaluate(sampleObject, '/b/d/1');
    expect(result).toBe(4);
  });

  it('can retrieve an array element with "/e/0"', () => {
    const result = evaluate(sampleObject, '/e/0');
    expect(result).toBe(5);
  });

  it('can retrieve a nested array within an array with "/e/2/1"', () => {
    const result = evaluate(sampleObject, '/e/2/1');
    expect(result).toBe(7);
  });

  it('throws an error for a nonexistent top-level key', () => {
    expect(() => evaluate(sampleObject, '/nonexistent')).toThrow(/Key not found: nonexistent/);
  });

  it('throws an error if we try to go deeper into a number with "/a/x"', () => {
    // a is 1, which is neither array nor object -> error
    expect(() => evaluate(sampleObject, '/a/x')).toThrow(/Cannot resolve token 'x' in non-object, non-array value/);
  });

  it('throws an error if an array index is out of bounds', () => {
    expect(() => evaluate(sampleObject, '/b/d/999')).toThrow(/Array index out of bounds: 999/);
  });

  it('throws an error if an array index is invalid (non-digit)', () => {
    expect(() => evaluate(sampleObject, '/b/d/abc')).toThrow(/Invalid array index: abc/);
  });

  it('throws an error when referencing "-" in an array by default', () => {
    expect(() => evaluate(sampleObject, '/e/-')).toThrow(
      /Invalid reference: '-' points to a non-existent array element/,
    );
  });

  it('throws an error if pointer references a property on undefined', () => {
    expect(() => evaluate(sampleObject, '/f/g')).toThrowError(/Key not found: f/);
  });

  it('throws an error if pointer references a property on a primitive', () => {
    expect(() => evaluate(sampleObject, '/b/c/someKey')).toThrow(
      /Cannot resolve token 'someKey' in non-object, non-array value/,
    );
  });

  it('can handle a pointer containing a slash in the property key if interpretPath supports "~1" decoding', () => {
    const trickyObject = {
      'slash/key': 'secret',
    };
    const result = evaluate(trickyObject, '/slash~1key');
    expect(result).toBe('secret');
  });

  it('can handle a pointer containing a tilde if interpretPath supports "~0" decoding', () => {
    const trickyObject = {
      'tilde~key': 123,
    };
    const result = evaluate(trickyObject, '/tilde~0key');
    expect(result).toBe(123);
  });
});
