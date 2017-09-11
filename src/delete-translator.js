const translator = require('./common-translator');

const createCollectionStatement = (node, dbName, colName) => {
  const argLen = node.arguments.length;
  if (argLen < 1) {
    const args = node.arguments;
    for (let i = 0; i < 1 - argLen; i += 1) {
      args.push({ type: 'ObjectExpression', properties: [] });
    }
    node.arguments = args;
  }
  const statement = translator.createCollectionStatement(node, dbName, colName);
  return { ...statement, arguments: node.arguments };
};

module.exports = {
  createCollectionStatement,
};
