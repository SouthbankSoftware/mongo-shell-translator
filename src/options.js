export const parseOptions = {
  tolerant: true,
  raw: true,
  tokens: true,
  range: true,
  comment: true,
};
export const syntaxType = {
  callback: 'callback',
  promise: 'promise',
  await: 'await',
};
export const commandName = {
  find: 'find',
  findOne: 'findOne',
  findOneAndDelete: 'findOneAndDelete',
  findOneAndReplace: 'findOneAndReplace',
  findOneAndUpdate: 'findOneAndUpdate',
  aggregate: 'aggregate',
  update: 'update',
  updateOne: 'updateOne',
  updateMany: 'updateMany',
  insert: 'insert',
  insertOne: 'insertOne',
  insertMany: 'insertMany',
  deleteOne: 'deleteOne',
  deleteMany: 'deleteMany',
  dropDatabase: 'dropDatabase',
  drop: 'drop',
  createIndex: 'createIndex',
  dropIndex: 'dropIndex',
  print: 'print',
};
