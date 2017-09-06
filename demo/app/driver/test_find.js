const MongoClient = require('mongodb').MongoClient;

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const ast = esprima.parse('db.find()');
let finished = false;
estraverse.traverse(ast, {
  leave: (node, parent) => {
    if (node.type === esprima.Syntax.ExpressionStatement && !finished) {
      finished = true;
      let statement = escodegen.generate(node);
      statement = `${statement.substring(0, statement.lastIndexOf(';'))}.toArray()`;
      const findAst = esprima.parse(statement);
      node.arguments = findAst.body[0].expression.arguments;
      node.callee = findAst.body[0].expression.callee;
      node.type = findAst.body[0].expression.type;
    }
  },
});

const generated = escodegen.generate(ast);
console.log('generated  code:', generated);

// Connection URL
const url = 'mongodb://localhost:27017/SampleCollections';

// MongoClient.connect(url, async(err, db) => {
//   db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray().then((docs) => {
//     console.log(docs);
//   });
// });
