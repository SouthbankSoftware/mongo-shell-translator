const translator = require('./common-translator');
const argumentCreator = require('./argument-creator');

const createCollectionStatement = (node, dbName, colName) => {
  const statement = translator.createCollectionStatement(node, dbName, colName);
  return Object.assign(statement, { arguments: argumentCreator.createArguments(node, 2, true) });
};

module.exports = {
  createCollectionStatement,
};