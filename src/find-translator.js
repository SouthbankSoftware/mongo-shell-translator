const translator = require('./common-translator');
const argumentCreator = require('./argument-creator');
const template = require('./template-ast');

/**
 * create parameterized function
 *
 * @param {*} statement
 */
const createParameterizedFunction = (statement) => {
  const db = translator.findDbName(statement.expression);
  const callee = statement.expression.callee;
  const collection = translator.findCollectionName(statement);
  const functionStatement = template.buildFunctionTemplate(`${collection}Find`, []);
  return functionStatement;
};

const createCollectionStatement = (node, dbName, colName) => {
  const statement = translator.createCollectionStatement(node, dbName, colName);
  return Object.assign(statement, { arguments: argumentCreator.createArguments(node, 0, 1) });
};

module.exports = {
  createCollectionStatement,
  createParameterizedFunction,
};
