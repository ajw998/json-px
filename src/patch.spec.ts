import { describe, it, expect } from 'vitest';
import { add, remove, replace, move, copy, test } from './patch';

describe('JSON Pointer Operations', () => {
  const initialObject = {
    a: 1,
    b: { c: 2, d: [3, 4] },
    e: [5, 6],
  };

  describe('add', () => {
    it('adds a value to the root', () => {
      const result = add({}, { op: 'add', path: '', value: { key: 'value' } });
      expect(result).toEqual({ value: { key: 'value' } });
    });

    it('adds a value to an object', () => {
      const result = add(initialObject, {
        op: 'add',
        path: '/b/newKey',
        value: 42,
      });
      expect(result).toEqual({
        ...initialObject,
        b: { ...initialObject.b, newKey: 42 },
      });
    });

    it('adds a value to an array at a specific index', () => {
      const result = add(initialObject, { op: 'add', path: '/e/1', value: 99 });
      expect(result).toEqual({ ...initialObject, e: [5, 99, 6] });
    });

    it('appends a value to an array', () => {
      const result = add(initialObject, { op: 'add', path: '/e/-', value: 99 });
      expect(result).toEqual({ ...initialObject, e: [5, 6, 99] });
    });

    it('throws an error for invalid path', () => {
      expect(() => add(initialObject, { op: 'add', path: '/nonexistent/-', value: 99 })).toThrowError(/^Key not found/);
    });
  });

  describe('remove', () => {
    it('removes a value from an object', () => {
      const result = remove(initialObject, { op: 'remove', path: '/b/c' });
      expect(result).toEqual({ ...initialObject, b: { d: [3, 4] } });
    });

    it('removes an element from an array', () => {
      const result = remove(initialObject, { op: 'remove', path: '/e/0' });
      expect(result).toEqual({ ...initialObject, e: [6] });
    });

    it('throws an error for invalid path', () => {
      expect(() => remove(initialObject, { op: 'remove', path: '/nonexistent' })).toThrow(
        'Attempting to access undefined value at target object.',
      );
    });
  });

  describe('replace', () => {
    it('replaces a value in an object', () => {
      const result = replace(initialObject, {
        op: 'replace',
        path: '/b/c',
        value: 99,
      });
      expect(result).toEqual({
        ...initialObject,
        b: { ...initialObject.b, c: 99 },
      });
    });

    it('replaces an element in an array', () => {
      const result = replace(initialObject, {
        op: 'replace',
        path: '/e/1',
        value: 99,
      });
      expect(result).toEqual({ ...initialObject, e: [5, 99] });
    });
  });

  describe('move', () => {
    it('moves a value from one key to another', () => {
      const result = move(initialObject, {
        op: 'move',
        from: '/b/c',
        path: '/b/newKey',
      });
      expect(result).toEqual({ ...initialObject, b: { d: [3, 4], newKey: 2 } });
    });

    it('moves an array element to another key', () => {
      const result = move(initialObject, {
        op: 'move',
        from: '/e/0',
        path: '/b/c',
      });
      expect(result).toEqual({
        ...initialObject,
        b: { ...initialObject.b, c: 5 },
        e: [6],
      });
    });
  });

  describe('copy', () => {
    it('copies a value from one key to another', () => {
      const result = copy(initialObject, {
        op: 'copy',
        from: '/b/c',
        path: '/b/newKey',
      });
      expect(result).toEqual({
        ...initialObject,
        b: { ...initialObject.b, c: 2, newKey: 2 },
      });
    });

    it('copies an array element to another key', () => {
      const result = copy(initialObject, {
        op: 'copy',
        from: '/e/0',
        path: '/b/copy',
      });
      expect(result).toEqual({
        ...initialObject,
        b: { ...initialObject.b, copy: 5 },
      });
    });
  });

  describe('test', () => {
    it('tests a matching value at the root path', () => {
      const obj = { key: 'value' };
      const result = test(obj, {
        op: 'test',
        path: '',
        value: { key: 'value' },
      });
      expect(result).toBe(obj);
    });

    it('tests a matching numeric value in an object', () => {
      const result = test(initialObject, { op: 'test', path: '/a', value: 1 });
      expect(result).toBe(initialObject);
    });

    it('tests a matching array element', () => {
      const result = test(initialObject, {
        op: 'test',
        path: '/e/0',
        value: 5,
      });
      expect(result).toBe(initialObject);
    });

    it('tests a nested object value', () => {
      const result = test(initialObject, {
        op: 'test',
        path: '/b/c',
        value: 2,
      });
      expect(result).toBe(initialObject);
    });

    it('tests a nested array for exact equality', () => {
      const result = test(initialObject, {
        op: 'test',
        path: '/b/d',
        value: [3, 4],
      });
      expect(result).toBe(initialObject);
    });

    it('throws an error if the value does not match (primitive mismatch)', () => {
      expect(() => test(initialObject, { op: 'test', path: '/a', value: 999 })).toThrowError(
        /Test operation failed due to value mismatch/i,
      );
    });

    it('throws an error for a mismatch in object values', () => {
      expect(() =>
        test(initialObject, {
          op: 'test',
          path: '/b/c',
          value: { unexpected: true },
        }),
      ).toThrowError(/Test operation failed due to value mismatch/i);
    });

    it('throws an error for an invalid path', () => {
      expect(() => test(initialObject, { op: 'test', path: '/x', value: 'anything' })).toThrowError(/Key not found/i);
    });

    it('tests deeply nested structures', () => {
      const deeplyNested = {
        x: {
          y: {
            z: [{ foo: 'bar' }, { foo: 'baz' }],
          },
        },
      };
      const result = test(deeplyNested, {
        op: 'test',
        path: '/x/y/z',
        value: [{ foo: 'bar' }, { foo: 'baz' }],
      });
      expect(result).toBe(deeplyNested);
    });

    it('throws an error for mismatched arrays', () => {
      expect(() => test(initialObject, { op: 'test', path: '/e', value: [5, 6, 7] })).toThrowError(
        /Test operation failed due to value mismatch/i,
      );
    });
  });
});
