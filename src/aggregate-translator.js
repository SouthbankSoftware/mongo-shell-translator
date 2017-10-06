const commonTranslator = require('./common-translator');
const escodegen = require('escodegen');
const esprima = require('esprima');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');

const getMatchFromPipeline = (args) => {
  let matchParam = [];
  let restParams = [];
  if (args.length <= 0 || !args[0].elements) {
    return [];
  }
  args[0].elements.forEach((argument) => {
    if (argument.properties) {
      argument.properties.forEach((p) => {
        if (matchParam.length === 0 && p.key && p.key.name === '$match') {
          matchParam.push(argument);
        } else {
          restParams.push(argument);
        }
      });
    }
  });
  return { restParams, matchParam };
};

const createParameters = (statement, expression, originFunName, context) => {
  const db = commonTranslator.findDbName(statement);
  const collection = commonTranslator.findCollectionName(statement);
  const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
  const { matchParam, restParams } = getMatchFromPipeline(expression.arguments);
  const driverFunctionName = originFunName;
  let functionName = `${collection}${parameterParser.capitalizeFirst(driverFunctionName)}`;
  functionName = context.getFunctionName(functionName);
  let queryCmd = '';
  let callFunctionParams = `${db},`; // the parameters we need to put on calling the generated function
  let extraParam = '';
  if (matchParam.length > 0) {
    const pNum = parameterParser.getParameterNumber(matchParam[0]);
    let restPipeline = '';
    restParams.forEach((a) => {
      restPipeline += `${escodegen.generate(a)},`;
    });
    if (pNum <= 4) {
      const { queryObject, parameters } = parameterParser.parseQueryParameters(matchParam[0]);
      queryCmd += `const pipeline = [${queryObject}, ${restPipeline}]`;
      if (parameters.length === 0) {
        callFunctionParams += `${queryObject},`;
      }
      parameters.forEach((p) => {
        functionParams.push({ type: esprima.Syntax.Identifier, name: p.name });
        callFunctionParams += p.value;
        callFunctionParams += ',';
      });
    } else {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
      const { queryObject, parameters } = parameterParser.parseQueryManyParameters(matchParam[0]);
      queryCmd += `const pipeline = [${queryObject}, ${restPipeline}]`;
      callFunctionParams = '{';
      parameters.forEach((p) => {
        callFunctionParams += `'${p.name}':${p.value},`;
      });
      callFunctionParams += '},';
    }
  } else {
    queryCmd = 'const pipeline = {}';
  }
  return { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams };
};

const createParameterizedFunction = (statement, updateExpression, params, context, originFunName) => {
  let { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams } = createParameters(statement, updateExpression, originFunName, context);
  const functionStatement = commonTranslator.createFuncationStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd, callFunctionParams, db });
  commonTranslator.addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam });
  const callStatement = commonTranslator.createCallStatement(functionName, callFunctionParams);
  return { functionStatement, functionName, callStatement };
};

module.exports = {
  createParameterizedFunction,
};
