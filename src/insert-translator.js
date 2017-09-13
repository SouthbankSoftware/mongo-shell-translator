const translator = require('./common-translator');
const esprima = require('esprima');

const createCollectionStatement = (node, dbName, colName) => {
  let multi = false; // whether insert multiple docs
  const argLen = node.arguments ? node.arguments.length : 0;
  if (argLen >= 1) {
    // check multi parameter
    const arg = node.arguments[0];
    if (arg.type === esprima.Syntax.ArrayExpression) {
      multi = true;
    } else if (arg.type === esprima.Syntax.Identifier) {
      multi = false;
    }
  }
  console.log('multi insert ', multi);
  if (node.callee && node.callee.property && node.callee.property.name === 'insert') {
    node.callee.property.name = multi ? 'insertMany' : 'insertOne';
  }
  const statement = translator.createCollectionStatement(node, dbName, colName);
  return Object.assign(statement, { arguments: node.arguments });
};

module.exports = {
  createCollectionStatement,
};
