const MongoClient = require('mongodb').MongoClient;
const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

let ast = esprima.parseScript('db.find().test()//dd', {
  tolerant: true,
  raw: true,
  tokens: true,
  range: true,
  comment: true,
});
// console.log(ast);
ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
// console.log(ast);
// Connection URL
const url = 'mongodb://localhost:27017/SampleCollections';

const aggregateTest = (db) => {
  // db.collection('explains').aggregate([], { explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true }).toArray((err, docs) => {
  //   console.log(docs);
  // });
  db.collection('explains').aggregate([], { explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true }).toArray().then((docs) => {
    console.log(docs);
  });
  // db.collection('enron_messages').aggregate([
  //   { $match: { $and: [{ 'headers.To': { $ne: '' } }] } },
  //   { $unwind: '$subFolder' },
  //   {
  //     $group: {
  //       _id: { filename: '$filename' },
  //       count: { $sum: 1 },
  //       'headers-sum': { $sum: '$headers' },
  //     },
  //   },
  // ], { allowDiskUse: true }).toArray().then((docs) => {
  //   console.log(docs);
  // });
};

const updateTest = async(db) => {
  // db.collection('explains').updateOne({}, {}, {}, (docs) => {
  //   console.log('doc:', docs);
  // });
  // db.collection('test').updateOne({ a: 1 }, { b: 2, a: 1 }, (err, docs) => {
  //   console.log(docs);
  // });
  // db.collection('collection').updateOne({ name: 'Central Perk Cafe' }, { $set: { violations: 3 } }, (err, r) => {
  //   console.log(r);
  // });

  // db.collection('explains').updateOne({ name: 'Central Perk Cafe' }, {}).then((r) => {
  //   console.log(r);
  // });
  const r = await db.collection('explains').updateOne({ name: 'Central Perk Cafe' }, {});
  console.log(r);
};

const fun = async function(db) {
  const r = await db.collection('test').updateOne({}, {});
  console.log(r);
};

const deleteTest = async(db) => {
  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, (err, r) => {
  //   console.log(r);
  // });
  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, { w: 1, wtimeout: 400, j: false }, (err, r) => {
  //   console.log(r);
  // });
  // db.collection('explains').deleteOne({}).then((r) => {
  //   console.log(r);
  // });

  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }).then((r) => {
  //   console.log(r);
  // });

  // db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, { w: 1, wtimeout: 400, j: false }).then((r) => {
  //   console.log(r);
  // });
  // eval("const r = await db.collection('explains').deleteOne({ 'user.name.last': 'Lee' }, { w: 1, wtimeout: 400, j: false }); console.log(r);");
  const aaa = eval(" db.collection('explains').find().toArray().then((doc) => console.log(doc))");
  console.log(aaa);
};

MongoClient.connect(url, async(err, db) => {
  // db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray((err, docs) => {
  //   console.log(docs);
  // });

  // db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray().then((docs) => {
  //   console.log(docs);
  // });

  // const docs = await db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray();
  // db.collection('explains').aggregate([{
  //   $project: {
  //     'user.name.last': 1,
  //   },
  // }], (err, result) => {
  //   console.log(result.length);
  // });
  // db.collection('explains').find().toArray().then((docs) => {
  //   console.log(docs);
  // });
  // db.collection('explains').aggregate([
  //   { $match: { $and: [{ 'tags.label': { $ne: '' } }] } },
  //   { $sort: { 'user.age': 1 } },
  // ]).toArray().then((docs) => {
  //   console.log(docs);
  // });
  // aggregateTest(db);
  // updateTest(db);
  // fun(db);
  deleteTest(db);
});
