const translator = require('./common-translator');

const createCollectionStatement = (node, dbName, colName) => {
  const statement = translator.createCollectionStatement(node, dbName, colName);
  let args = [];
  if (node.arguments.length > 0) {
    args = [node.arguments[0]];
  }
  return { ...statement, arguments: args };
};

module.exports = {
  createCollectionStatement,
};
