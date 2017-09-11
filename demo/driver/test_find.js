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
  // console.log(docs);
  // });
  // db.collection('explains').aggregate([], { explain: false, allowDiskUse: true, maxTimeMS: 100, bypassDocumentValidation: true }).toArray().then((docs) => {
  //   console.log(docs);
  // });
  db.collection('enron_messages').aggregate([
    { $match: { $and: [{ 'headers.To': { $ne: '' } }] } },
    { $unwind: '$subFolder' },
    {
      $group: {
        _id: { filename: '$filename' },
        count: { $sum: 1 },
        'headers-sum': { $sum: '$headers' },
      },
    },
  ], { allowDiskUse: true }).toArray().then((docs) => {
    console.log(docs);
  });
};

MongoClient.connect(url, async(err, db) => {
  // db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray((err, docs) => {
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
  aggregateTest(db);
});
