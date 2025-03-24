import { describe, it, expect } from 'vitest';
import { isEqual } from './helpers';

describe('isEqual - Primitives & Special Values', () => {
  it.each([
    ['identical numbers', 42, 42, true],
    ['different numbers', 42, 100, false],
    ['identical strings', 'hello', 'hello', true],
    ['different strings', 'hello', 'world', false],
    ['boolean true vs true', true, true, true],
    ['boolean false vs false', false, false, true],
    ['boolean true vs false', true, false, false],
    ['null vs null', null, null, true],
    ['null vs undefined', null, undefined, false],
    ['undefined vs null', undefined, null, false],
    ['NaN vs NaN', NaN, NaN, true],
    ['NaN vs number', NaN, 123, false],
    ['number vs string', 42, '42', false],
  ])('should return %s => %s', (_, a, b, expected) => {
    expect(isEqual(a, b)).toBe(expected);
  });
});

describe('isEqual - Simple Objects', () => {
  it.each([
    ['identical empty objects', {}, {}, true],
    ['identical single-key objects', { a: 1 }, { a: 1 }, true],
    ['different single-key objects', { a: 1 }, { a: 2 }, false],
    ['objects with different keys', { a: 1 }, { b: 1 }, false],
    ['identical nested objects', { a: { b: 2, c: 3 } }, { a: { b: 2, c: 3 } }, true],
    ['nested objects mismatch', { a: { b: 2, c: 3 } }, { a: { b: 2, c: 4 } }, false],
  ])('should correctly compare %s', (_, a, b, expected) => {
    expect(isEqual(a, b)).toBe(expected);
  });
});

describe('isEqual - Arrays of Primitives', () => {
  it.each([
    ['identical arrays', [1, 2, 3], [1, 2, 3], true],
    ['different arrays (length)', [1, 2], [1, 2, 3], false],
    ['different arrays (element mismatch)', [1, 2, 3], [1, 2, 4], false],
    ['empty arrays', [], [], true],
    ['string vs number inside array', ['1', '2'], [1, 2], false],
  ])('should correctly compare %s', (_, a, b, expected) => {
    expect(isEqual(a, b)).toBe(expected);
  });
});

describe('isEqual - Arrays of Objects', () => {
  it.each([
    ['identical arrays of simple objects', [{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 2 }], true],
    [
      'arrays of objects differ in one field',
      [{ id: 1 }, { id: 2, name: 'Bob' }],
      [{ id: 1 }, { id: 2, name: 'Alice' }],
      false,
    ],
    ['arrays of objects differ in length', [{ id: 1 }, { id: 2 }], [{ id: 1 }], false],
    [
      'identical arrays with nested objects',
      [
        { id: 1, meta: { active: true, tags: ['test', 'beta'] } },
        { id: 2, meta: { active: false, tags: ['release'] } },
      ],
      [
        { id: 1, meta: { active: true, tags: ['test', 'beta'] } },
        { id: 2, meta: { active: false, tags: ['release'] } },
      ],
      true,
    ],
    [
      'deeply nested mismatch (nested array difference)',
      [
        { id: 1, meta: { active: true, tags: ['test', 'beta'] } },
        { id: 2, meta: { active: false, tags: ['release'] } },
      ],
      [
        { id: 1, meta: { active: true, tags: ['test', 'prod'] } },
        { id: 2, meta: { active: false, tags: ['release'] } },
      ],
      false,
    ],
    [
      'deeply nested mismatch (nested object difference)',
      [{ id: 1, details: { name: 'Alice', address: { city: 'London' } } }],
      [{ id: 1, details: { name: 'Alice', address: { city: 'Paris' } } }],
      false,
    ],
  ])('should correctly compare: %s', (_, a, b, expected) => {
    expect(isEqual(a, b)).toBe(expected);
  });
});
