const translator = require('./common-translator');
const argumentCreator = require('./argument-creator');
const template = require('./template-ast');
const esprima = require('esprima');
const escodegen = require('escodegen');
const parameterParser = require('./parameter-parser');

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
    const pNum = parameterParser.getParameterNumber(args[0]);
    if (pNum <= 4) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
      const queryObject = parameterParser.parseQueryParameters(args[0]);
      queryCmd += `const query = ${queryObject}`;
    } else {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
      const queryObject = parameterParser.parseQueryManyParameters(args[0]);
      queryCmd += `const query = ${queryObject}`;
    }
  }
  let projections = '';
  if (args.length > 1 && queryCmd) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'fields' });
    projections = escodegen.generate(args[1]);
  }
  let limit;
  if (args.lenght > 2) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'limit' });
    limit = escodegen.generate(args[2]);
  }
  let skip;
  if (args.lenght > 3) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'skip' });
    skip = escodegen.generate(args[2]);
  }
  let batchSize;
  if (args.lenght > 4) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'batchSize' });
    batchSize = escodegen.generate(args[2]);
  }
  const functionStatement = template.buildFunctionTemplate(`${collection}Find`, functionParams);
  const prom = translator.getPromiseStatement('returnData');
  if (queryCmd) {
    const body = prom.body[0].declarations[0].init.arguments[0].body.body;
    functionStatement.body.body.push(esprima.parseScript(queryCmd).body[0]);
    let queryStatement = `${db}.collection('${collection}').find(query)`;
    if (projections) {
      queryStatement += `.project(${projections})`;
    }
    if (limit) {
      queryStatement += `.limit(${limit})`;
    }
    if (skip) {
      queryStatement += `.skip(${skip})`;
    }
    if (batchSize) {
      queryStatement += `.batchSize(${batchSize})`;
    }
    queryStatement += '.toArray()';
    body.push(esprima.parseScript(queryStatement));
    body.push(esprima.parseScript('resolve(returnData)'));
  }

  functionStatement.body.body.push(prom);

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
