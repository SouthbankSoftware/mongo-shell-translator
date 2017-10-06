const commonTranslator = require('./common-translator');
const escodegen = require('escodegen');
const esprima = require('esprima');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');

const getMatchFromPipeline = (args) => {
  let matchParam;
  if (args.length <= 0 || !args[0].elements) {
    return [];
  }
  args[0].elements.forEach((argument) => {
    if (!matchParam && argument.properties) {
      argument.properties.forEach((p) => {
        if (p.key && p.key.name === '$match') {
          matchParam = argument;
        }
      });
    }
  });
  return [matchParam];
};

const createParameters = (statement, expression, originFunName, context) => {
  const db = commonTranslator.findDbName(statement);
  const collection = commonTranslator.findCollectionName(statement);
  const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
  const args = getMatchFromPipeline(expression.arguments);
  const driverFunctionName = originFunName;
  let functionName = `${collection}${parameterParser.capitalizeFirst(driverFunctionName)}`;
  functionName = context.getFunctionName(functionName);
  let queryCmd = '';
  let callFunctionParams = `${db},`; // the parameters we need to put on calling the generated function
  let extraParam = '';
  if (args.length > 0) {
    const pNum = parameterParser.getParameterNumber(args[0]);
    if (pNum <= 4) {
      const { queryObject, parameters } = parameterParser.parseQueryParameters(args[0]);
      queryCmd += `const query = ${queryObject}`;
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
      const { queryObject, parameters } = parameterParser.parseQueryManyParameters(args[0]);
      queryCmd += `const query = ${queryObject}`;
      callFunctionParams = '{';
      parameters.forEach((p) => {
        callFunctionParams += `'${p.name}':${p.value},`;
      });
      callFunctionParams += '},';
    }
    args.slice(1).forEach((arg, i) => {
      functionParams.push({ type: esprima.Syntax.Identifier, name: `arg${i + 1}` });
      extraParam += `${escodegen.generate(arg)},`;
    });
    callFunctionParams += extraParam;
  } else {
    queryCmd = 'const query = {}';
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
