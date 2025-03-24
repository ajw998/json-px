import { isObject, interpretPath, isEqual } from './helpers';
import { evaluate } from './pointer';
import { JSONObject, AddOp, CopyOp, MoveOp, Operation, RemoveOp, ReplaceOp, TestOp } from './types';

export const add = (object: JSONObject, operation: AddOp): JSONObject => {
  const { path, value } = operation;
  const { paths } = interpretPath(operation.path);

  const objectClone = structuredClone(object);

  // Valid JSON pointer must start with '/'
  if (paths[0] !== '') throw new Error(`Invalid JSON Pointer: ${path}`);

  // If the replacement target is the root of the document, the specified
  // value becomes the entire content of the target document.
  if (paths.length === 1) return { value };

  const lastEl = paths.at(-1);

  if (!lastEl) throw new Error(`Invalid JSON pointer: ${path}`);

  // maybeValidPath is the path which we need to validate against.
  // Note that for complex type additions, the 'parent' object or array
  // must always exist.
  //
  // > [T]he object itself or an array containing it does need to
  // > exist, and it remains an error for that not to be the case.
  const maybeValidPath = paths.slice(0, -1);
  const target = evaluate(maybeValidPath.join('/'), objectClone);

  // If the last element is '-', this means the user is attempting
  // to push an element to an array. The preconditions to this is
  // that the array must exist
  //
  // > An element to add to an existing array - whereupon the supplied
  // > value is added to the array at the indicated location.  Any
  // > elements at or above the specified index are shifted one position
  // > to the right.  The specified index MUST NOT be greater than the
  // > number of elements in the array.  If the "-" character is used to
  // > index the end of the array (see [RFC6901]), this has the effect of
  // > appending the value to the array.
  if (lastEl === '-') {
    if (!Array.isArray(target)) throw new Error(`Invalid pointer operation on target.`);
    target.push(value);
    return objectClone;
  }

  // If the last element is a number, that means the user is attempting
  // to insert an element into an existing array at a specific position
  // Note that the index must not be greater than the length of the array.
  // This was not implemented properly in package `chbrown/rfc6902`.
  if (/^\d+$/.test(lastEl)) {
    if (!Array.isArray(target)) throw new Error(`Invalid pointer operation on target.`);
    if (target.length < Number(lastEl))
      throw new Error(`Pointer index: ${lastEl} must not be greater than target array length: ${target.length}.`);

    target.splice(Number(lastEl), 0, value);
    return objectClone;
  }

  if (isObject(target)) {
    target[lastEl] = value;
    return objectClone;
  }

  throw new Error(`Invalid add operation for pointer: ${operation.path}`);
};

// Remove operation
//
// The checks defined in this operations are rigorous – the exact element
// must exist for the function to pass.
//
// > The "remove" operation removes the value at the target location.
// > The target location MUST exist for the operation to be successful.
export const remove = (object: JSONObject, operation: RemoveOp): JSONObject => {
  const { path } = operation;
  const { paths } = interpretPath(operation.path);

  const objectClone = structuredClone(object);

  // Valid JSON pointer must start with '/'
  if (paths[0] !== '') throw new Error(`Invalid JSON Pointer: ${path}`);

  // If the direction is to match the entire object, then just return an empty object
  if (paths.length === 1) return {};

  const lastEl = paths.at(-1);

  // We just need to handle this unique case of safety purposes. In reality this would
  // never happen as the first element of `paths` will always be validated against an empty string
  if (!lastEl) return object;

  if (lastEl === '-') throw new Error(`Invalid pointer for remove operation: ${operation.path}`);

  const maybeValidPath = paths.slice(0, -1);
  const target = evaluate(maybeValidPath.join('/'), objectClone);

  if (/^\d+$/.test(lastEl)) {
    if (!Array.isArray(target)) throw new Error(`Cannot remove array elements at non-Array target.`);

    const index = parseInt(lastEl, 10);

    if (!target[index]) throw new Error(`Attempting to index non-existent element at target array.`);
    target.splice(index, 1);
    return objectClone;
  }

  if (isObject(target)) {
    if (target[lastEl] === undefined) throw new Error(`Attempting to access undefined value at target object.`);
    delete target[lastEl];
    return objectClone;
  }

  throw new Error(`Invalid remove operation for pointer: ${operation.path}`);
};

// Replace operation
//
// > This operation is functionally identical to a "remove" operation for
// > a value, followed immediately by an "add" operation at the same
// > location with the replacement value.
export const replace = (object: JSONObject, operation: ReplaceOp) => {
  return add(remove(object, { ...operation, op: 'remove' }), {
    ...operation,
    op: 'add',
  });
};

// Move operation
//
// > This operation is functionally identical to a "remove" operation on
// > the "from" location, followed immediately by an "add" operation at
// > the target location with the value that was just removed.
export const move = (object: JSONObject, operation: MoveOp) => {
  const value = evaluate(operation.from, object);
  return add(remove(object, { op: 'remove', path: operation.from }), {
    op: 'add',
    path: operation.path,
    value,
  });
};

// Test operation
//
// > The "test" operation tests that a value at the target location is
// > equal to a specified value.
// > The operation object MUST contain a "value" member that conveys the
// > value to be compared to the target location's value.
//
// Note that this operation returns the original object if successful. It will only
// produce a side effect if the operation is considered unsuccessful. This is because the RFC
// allows for patch chaining, so a functional implementation of applyPatch will necessitate that
// `test` returns a value
export const test = (object: JSONObject, operation: TestOp) => {
  const evaluateValue = evaluate(operation.path, object);
  const compareValue = operation.value;
  // The operation is considered NOT successful and should therefore throw a fatal error
  // >  If a normative requirement is violated by a JSON Patch document, or
  // >  if an operation is not successful, evaluation of the JSON Patch
  // >  document SHOULD terminate and application of the entire patch
  // >  document SHALL NOT be deemed successful.
  if (!isEqual(evaluateValue, compareValue)) throw new Error('Test operation failed due to value mismatch.');

  return object;
};

// Copy operation
//
// > This operation is functionally identical to an "add" operation at the
// > target location using the value specified in the "from" member.
export const copy = (object: JSONObject, operation: CopyOp) => {
  const { from, path } = operation;

  if (from === path) return object;

  const value = evaluate(operation.from, object);
  return add(object, { ...operation, op: 'add', value });
};

// Internal apply method
//
// This is the pure apply patch function which will be called by
// the application-specific apply method
export const apply = (object: JSONObject, operation: Operation) => {
  switch (operation.op) {
    case 'add':
      return add(object, operation);
    case 'remove':
      return remove(object, operation);
    case 'copy':
      return copy(object, operation);
    case 'replace':
      return replace(object, operation);
    case 'move':
      return move(object, operation);
    case 'test':
      return test(object, operation);
    default:
      return object;
  }
};

export const applyPatch = (
  object: JSONObject,
  operations: Operation[],
  hooks?: ((object: JSONObject, operations: Operation[]) => void)[],
) => {
  const result = operations.reduce((object, operation) => apply(object, operation), object);

  if (hooks && hooks.length > 0) {
    hooks.forEach((hook) => {
      hook(result, operations);
    });
  }
  return result;
};
