# json-px

Node.js library to apply [JSON Patches](https://datatracker.ietf.org/doc/html/rfc6902).

This library focuses on implementation correctness.

## Functions

### JSON Pointer

`evaluate`

Evaluate a JSON pointer

```typescript
evaluate({ foo: 'bar' }, '/foo')

// Result
// bar
```

### High-level operations

`apply`

Apply a single JSON Patch operation to a JSON.

```typescript
apply({ foo: 'bar' }, { op: 'add', path: '/baz', value: 'fuz' });

// Result
// { foo: 'bar', baz: 'fuz' }
```

`applyPatch`

Apply a list of JSON Patch operations to a JSON.

```typescript
applyPatch({ foo: 'bar' }, [
  { op: 'add', path: '/baz', value: 0 },
  { op: 'remove', path: '/foo' },
  { op: 'test', path: '/baz', value: 0 },
]);

// Result
// { baz : 0 }
```

### JSON Patch Methods

`add`

```typescript
add({ foo: 'bar' }, { op: 'add', path: '/baz', value: 0 });

// Result
// { foo: 'bar', baz: 0 }
```

`remove`

```typescript
remove({ foo: 'bar' }, { op: 'remove', path: '/foo' });

// Result
// {}
```

`copy`

```typescript
copy({ user: { name: 'Jane' } }, { op: 'copy', from: '/user/name', path: '/displayName' });

// Result
// { user: { name: 'Jane' } , displayName: 'Jane' }
```

`replace`

```typescript
replace({ user: { name: 'Jane' } }, { op: 'copy', path: '/user/name', value: 'John' });

// Result
// { user: { name: 'John' } }
```

`test`

```typescript
test({ user: { name: 'Jane' } }, { op: 'test', path: '/user/name', value: 'Jane' });

// Result
// { user: { name: 'Jane' } }

test({ user: { name: 'Jane' } }, { op: 'test', path: '/user/name', value: 'Invalid value' });
// Result: Error
```

## License
MIT
