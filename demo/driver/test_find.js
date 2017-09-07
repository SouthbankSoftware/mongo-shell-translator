const MongoClient = require('mongodb').MongoClient;

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const generated = escodegen.generate(ast);
console.log('generated  code:', generated);

// Connection URL
const url = 'mongodb://localhost:27017/SampleCollections';

// MongoClient.connect(url, async(err, db) => {
//   db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray().then((docs) => {
//     console.log(docs);
//   });
// });
