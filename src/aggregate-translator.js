const commonTranslator = require('./common-translator');
const escodegen = require('escodegen');
const esprima = require('esprima');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');

const getPipelineByName = (args, pipeLine) => {
  let matchParam = [];
  let restParams = [];
  if (args.length <= 0 || !args[0].elements) {
    return [];
  }
  args[0].elements.forEach((argument) => {
    if (argument.properties) {
      argument.properties.forEach((p) => {
        if (matchParam.length === 0 && p.key && p.key.name === pipeLine) {
          matchParam.push(argument);
        } else {
          restParams.push(argument);
        }
      });
    }
  });
  return { restParams, matchParam };
};

class AggregateTranslator extends commonTranslator.CommonTranslator {
  createParameters(statement, expression, originFunName, context) {
    const db = this.findDbName(statement);
    const collection = this.findCollectionName(statement);
    const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
    const { matchParam, restParams } = getPipelineByName(expression.arguments, '$match');
    const limitParam = getPipelineByName(expression.arguments, '$limit').matchParam;
    const driverFunctionName = originFunName;
    let functionName = `${collection}${parameterParser.capitalizeFirst(driverFunctionName)}`;
    functionName = context.getFunctionName(functionName);
    let queryCmd = '';
    let callFunctionParams = `${db},`; // the parameters we need to put on calling the generated function
    let extraParam = '';
    if (expression.arguments.length > 1) {
      extraParam = escodegen.generate(expression.arguments[1]);
    }
    if (limitParam.length === 0) {
      const lp = {
        type: esprima.Syntax.ObjectExpression,
        properties: [{
          key: {
            type: esprima.Syntax.Identifier,
            name: '$limit',
          },
          value: {
            type: esprima.Syntax.Literal,
            value: 20,
          },
        }],
      };
      restParams.push(lp);
    }
    if (matchParam.length > 0) {
      const pNum = parameterParser.getParameterNumber(matchParam[0]);
      let restPipeline = '';
      restParams.forEach((a) => {
        restPipeline += `${escodegen.generate(a)},`;
      });
      if (pNum <= 4) {
        const { queryObject, parameters } = parameterParser.parseQueryParameters(matchParam[0]);
        queryCmd += `const query = [${queryObject}, ${restPipeline}]`;
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
        queryCmd += `const query = [${queryObject}, ${restPipeline}]`;
        callFunctionParams = '{';
        parameters.forEach((p) => {
          callFunctionParams += `'${p.name}':${p.value},`;
        });
        callFunctionParams += '},';
      }
    } else {
      let restPipeline = '';
      restParams.forEach((a) => {
        restPipeline += `${escodegen.generate(a)},`;
      });
      queryCmd = `const query = [${restPipeline}]`;
    }
    return { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams };
  }

  createParameterizedFunction(statement, updateExpression, params, context, originFunName, variableName) {
    let { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams } = this.createParameters(statement, updateExpression, originFunName, context);
    const functionStatement = this.createFunctionStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd, callFunctionParams, db });
    this.addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam });
    const callStatement = this.createCallStatementArrayOutput(functionName, callFunctionParams, variableName);
    return { functionStatement, functionName, callStatement };
  }

}
module.exports = {
  AggregateTranslator,
};
