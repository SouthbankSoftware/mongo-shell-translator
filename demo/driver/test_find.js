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
estraverse.traverse(ast, {
  cursor: 0,
  enter(node) {
    console.log('NODE', node);
  },
});
console.log(escodegen.generate(ast, {
  format: {
    indent: {
      style: '    ',
      base: 0,
      adjustMultilineComment: false,
    },
    newline: '\n',
    space: ' ',
    json: false,
    renumber: false,
    hexadecimal: false,
    preserveBlankLines: true,
    quotes: 'single',
    escapeless: false,
    compact: false,
    parentheses: true,
    semicolons: true,
    safeConcatenation: false,
  },
  moz: {
    starlessGenerator: false,
    parenthesizedComprehensionBlock: false,
    comprehensionExpressionStartsWithAssignment: false,
  },
  parse: null,
  comment: true,
  sourceMap: undefined,
  sourceMapRoot: null,
  sourceMapWithCode: false,
  file: undefined,
  sourceContent: 'originalSource',
  directive: false,
  verbatim: undefined,
}));
// Connection URL
const url = 'mongodb://localhost:27017/SampleCollections';

MongoClient.connect(url, async(err, db) => {
  // db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray((err, docs) => {
  //   console.log(docs);
  // });

  const docs = await db.collection('explains').find({ 'user.name.last': 'Hall' }, { _id: 0 }).toArray();
  console.log(docs);
});
