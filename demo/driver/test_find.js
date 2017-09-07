const MongoClient = require('mongodb').MongoClient;

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const g = escodegen.generate({
  type: 'AwaitExpression',
  argument: {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'db',
    },
    arguments: [],
  },
});
console.log(g);
// Connection URL
const url = 'mongodb://localhost:27017/SampleCollections';

MongoClient.connect(url, async(err, db) => {
  // db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray((err, docs) => {
  //   console.log(docs);
  // });

  // const docs = await db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray();
  // console.log(docs);
});
