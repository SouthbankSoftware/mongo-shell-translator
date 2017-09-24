const translator = require('./common-translator');
const argumentCreator = require('./argument-creator');
const template = require('./template-ast');
const esprima = require('esprima');
const escodegen = require('escodegen');
const parameterParser = require('./parameter-parser');
const _ = require('lodash');

/**
 * return an array of json object include ast expressions.
 *
 * @param {*} params an array include ast expression such as limit(10), skip(100), etc.
 */
const getJsonExpression = (params) => {
  return params.map((p) => {
    if (p.type === esprima.Syntax.CallExpression && p.callee.type === esprima.Syntax.MemberExpression) {
      const name = p.callee.property.name;
      if (p.arguments) {
        const parameters = p.arguments.map((argument) => {
          if (argument.type === esprima.Syntax.Literal) {
            return argument.value;
          } else if (argument.type === esprima.Syntax.ObjectExpression) {
            return escodegen.generate(argument);
          }
          return {};
        });
        if (parameters) {
          if (parameters.length === 1) {
            return { name, parameters: parameters[0] };
          }
          return { name, parameters };
        }
      }
      return { name, parameters: {} };
    }
    return {};
  });
};

/**
 * create parameterized function
 *
 * @param {*} statement
 * @param {*} findExpression the find expression inside the statement
 * @param {*} params an array include ast expression such as limit(10), skip(100), etc.
 */
const createParameterizedFunction = (statement, findExpression, params) => {
  const db = translator.findDbName(statement);
  const collection = translator.findCollectionName(statement);
  const functionName = `${collection}Find`;
  const args = findExpression.arguments;
  const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
  const expParams = getJsonExpression(params);
  let queryCmd = '';
  let callFunctionParams = '';
  if (args.length > 0) {
    const pNum = parameterParser.getParameterNumber(args[0]);
    if (pNum <= 4) {
      const { queryObject, parameters } = parameterParser.parseQueryParameters(args[0]);
      queryCmd += `const query = ${queryObject}`;
      parameters.forEach((p, i) => {
        functionParams.push({ type: esprima.Syntax.Identifier, name: p.name });
        callFunctionParams += p.value;
        if (i !== parameters.length - 1) {
          callFunctionParams += ',';
        }
      });
    } else {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
      const { queryObject } = parameterParser.parseQueryManyParameters(args[0]);
      queryCmd += `const query = ${queryObject}`;
    }
  } else {
    queryCmd = 'const query = {}';
  }
  let projections = '';
  if (args.length > 1) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'fields' });
    projections = escodegen.generate(args[1]);
  }
  let limit;
  const limitParam = _.find(expParams, { name: 'limit' });
  if (limitParam) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'limit' });
    limit = limitParam.parameters;
  } else if (args.length > 2) {
    if (args[2].type === esprima.Syntax.Literal) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'limit' });
      limit = args[2].value;
    }
  }
  let skip;
  const skipParam = _.find(expParams, { name: 'skip' });
  if (skipParam) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'skip' });
    skip = skipParam.parameters;
  } else if (args.length > 3) {
    if (args[3].type === esprima.Syntax.Literal) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'skip' });
      skip = args[3].value;
    }
  }
  let batchSize;
  const batchSizeParam = _.find(expParams, { name: 'batchSize' });
  if (batchSizeParam) {
    functionParams.push({ type: esprima.Syntax.Identifier, name: 'batchSize' });
    batchSize = batchSizeParam.parameters;
  } else if (args.length > 4) {
    if (args[4].type === esprima.Syntax.Literal) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'batchSize' });
      batchSize = args[4].value;
    }
  }
  const functionStatement = template.buildFunctionTemplate(functionName, functionParams);
  const prom = translator.getPromiseStatement('returnData');
  const body = prom.body[0].declarations[0].init.arguments[0].body.body;
  queryCmd && functionStatement.body.body.push(esprima.parseScript(queryCmd).body[0]);
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
  functionStatement.body.body.push(prom);
  functionStatement.body.body.push({ type: esprima.Syntax.ReturnStatement, argument: { type: esprima.Syntax.Identifier, name: '(returnData)' } });
  let callStatement = '';
  // if (callFunctionParams) {
  callStatement = esprima.parseScript(`${functionName}(${callFunctionParams})`);
  // }
  return { functionStatement, functionName, callStatement };
};

const createCollectionStatement = (node, dbName, colName) => {
  const statement = translator.createCollectionStatement(node, dbName, colName);
  return Object.assign(statement, { arguments: argumentCreator.createArguments(node, 0, 1) });
};

module.exports = {
  createCollectionStatement,
  createParameterizedFunction,
  getJsonExpression,
};
