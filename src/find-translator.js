const translator = require('./common-translator');
const argumentCreator = require('./argument-creator');
const template = require('./template-ast');
const esprima = require('esprima');
const escodegen = require('escodegen');
const parameterParser = require('./parameter-parser');

const findOperators = ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$and', '$not', '$nor', '$or', '$exists', '$type', '$mod', '$regex', '$text', '$where', '$geoIntersects', '$geoWithin', '$near', '$nearSphere', '$all', '$elemMatch', '$size', '$bitsAllClear', '$bitsAllSet', '$bitsAnyClear', '$bitsAnySet', '$comment', '$meta', '$slice'];

/**
 * create parameterized function
 *
 * @param {*} statement
 * @param {*} findExpression the find expression inside the statement
 */
const createParameterizedFunction = (statement, findExpression) => {
  const db = translator.findDbName(statement);
  const collection = translator.findCollectionName(statement);
  const args = findExpression.arguments;
  const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
  let queryCmd = '';
  if (args.length > 0) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
    const queryObject = parameterParser.parseQueryParameters(args[0]);
    queryCmd += `const query = ${queryObject}`;
  }
  if (args.length > 1) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'fields' });
  }
  if (args.lenght > 2) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'limit' });
  }
  if (args.lenght > 3) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'skip' });
  }
  if (args.lenght > 4) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'batchSize' });
  }
  if (args.lenght > 5) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'options' });
  }
  const functionStatement = template.buildFunctionTemplate(`${collection}Find`, functionParams);
  if (queryCmd) {
    functionStatement.body.body.push(esprima.parseScript(queryCmd).body[0]);
  }
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
