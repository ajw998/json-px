declare type JSONValue = string | number | boolean | JSONObject | JSONArray;

export interface JSONObject {
  [x: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

export type Operation = AddOp | RemoveOp | ReplaceOp | MoveOp | CopyOp | TestOp;

export type AddOp = {
  op: 'add';
  path: string;
  value: JSONValue;
};

export type RemoveOp = {
  op: 'remove';
  path: string;
};

export type ReplaceOp = {
  op: 'replace';
  path: string;
  value: JSONValue;
};

export type MoveOp = {
  op: 'move';
  from: string;
  path: string;
};

export type CopyOp = {
  op: 'copy';
  from: string;
  path: string;
};

export type TestOp = {
  op: 'test';
  path: string;
  value: JSONObject;
};
