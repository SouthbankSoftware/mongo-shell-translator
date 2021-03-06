const CommonTranslator = require('./common-translator').CommonTranslator;
const template = require('./template-ast');
const esprima = require('esprima');
const escodegen = require('escodegen');
const parameterParser = require('./parameter-parser');
const _ = require('lodash');

class FindTranslator extends CommonTranslator {
  createCallStatement(functionName, params, context, variableName = 'r') {
    let results = 'results';
    if (variableName === 'results') {
      results += '1';
    }
    const script = `const ${results}=${functionName}(${params}); \
  ${results}.then((${variableName}) => { \
      ${variableName}.forEach((doc) => {\
            console.log(JSON.stringify(doc));\
        });\
  }).catch(err => console.error(err));`;
    return esprima.parseScript(script);
  }

  /**
   * create parameterized function
   *
   * @param {*} statement
   * @param {*} findExpression the find expression inside the statement
   * @param {*} params an array include ast expression such as limit(10), skip(100), etc.
   * @param {*} originFunName original shell function name
   * @param {*} variableName  assign variable
   */
  createParameterizedFunction(statement, findExpression, params, context, originFunName, variableName) {
    const db = this.findDbName(statement);
    const collection = this.findCollectionName(statement);
    const functionName = context.getFunctionName(`${collection}Find`);
    const args = findExpression.arguments;
    const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
    const expParams = this.getJsonExpression(params);
    let queryCmd = '';
    let callFunctionParams = '';
    if (args.length > 0) {
      const pNum = parameterParser.getParameterNumber(args[0]);
      if (pNum <= 4) {
        const { queryObject, parameters } = parameterParser.parseQueryParameters(args[0]);
        if (parameters.length === 0) {
          callFunctionParams += `${queryObject},`;
          functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
          queryCmd += 'const query = q';
        } else {
          queryCmd += `const query = ${queryObject}`;
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
    } else {
      queryCmd = 'const query = {}';
    }
    let projections = '';
    if (args.length > 1) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'fields' });
      projections = 'fields';
      callFunctionParams += `${escodegen.generate(args[1])},`;
    }
    let limit;
    const limitParam = _.find(expParams, { name: 'limit' });
    if (limitParam) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'limit' });
      limit = limitParam.parameters;
      callFunctionParams += `${limit},`;
    } else if (args.length > 2) {
      if (args[2].type === esprima.Syntax.Literal) {
        functionParams.push({ type: esprima.Syntax.Identifier, name: 'limit' });
        limit = args[2].value;
        callFunctionParams += `${limit},`;
      }
    }
    let skip;
    const skipParam = _.find(expParams, { name: 'skip' });
    if (skipParam) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'skip' });
      skip = skipParam.parameters;
      callFunctionParams += `${skip},`;
    } else if (args.length > 3) {
      if (args[3].type === esprima.Syntax.Literal) {
        functionParams.push({ type: esprima.Syntax.Identifier, name: 'skip' });
        skip = args[3].value;
        callFunctionParams += `${skip},`;
      }
    }
    let batchSize;
    const batchSizeParam = _.find(expParams, { name: 'batchSize' });
    if (batchSizeParam) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'batchSize' });
      batchSize = batchSizeParam.parameters;
      callFunctionParams += `${batchSize},`;
    } else if (args.length > 4) {
      if (args[4].type === esprima.Syntax.Literal) {
        functionParams.push({ type: esprima.Syntax.Identifier, name: 'batchSize' });
        batchSize = args[4].value;
        callFunctionParams += `${batchSize},`;
      }
    }

    let cursorParams = '';
    expParams.forEach((p) => {
      if (p.name !== 'batchSize' && p.name !== 'limit' && p.name !== 'skip' && p.name !== 'toArray') {
        functionParams.push({ type: esprima.Syntax.Identifier, name: p.name });
        if (!p.parameters || p.parameters.length === 0) {
          p.parameters = '{}';
        }
        callFunctionParams += `${p.parameters},`;
        cursorParams += `.${p.name}(${p.name})`;
      }
    });
    const functionStatement = template.buildFunctionTemplate(functionName, functionParams);
    const prom = this.getPromiseStatement('returnData');
    const body = prom.body[0].declarations[0].init.arguments[0].body.body;
    if (context.currentDB) {
      functionStatement.body.body.push(esprima.parseScript(`const useDb = db.db("${context.currentDB}")`).body[0]);
    } else {
      functionStatement.body.body.push(esprima.parseScript('const useDb = db').body[0]);
    }
    queryCmd && functionStatement.body.body.push(esprima.parseScript(queryCmd).body[0]);
    let queryStatement = `const arrayData = useDb.collection('${collection}').${originFunName}(query)`;
    if (projections) {
      queryStatement += `.project(${projections})`;
    }
    if (limit) {
      queryStatement += '.limit(limit)';
    } else if (originFunName === 'find') {
      queryStatement += '.limit(20)';
    }
    if (skip) {
      queryStatement += '.skip(skip)';
    }
    if (batchSize) {
      queryStatement += '.batchSize(batchSize)';
    }
    if (cursorParams) {
      queryStatement += cursorParams;
    }
    if (originFunName === 'find') {
      queryStatement += '.toArray()';
    }
    body.push(esprima.parseScript(queryStatement));
    body.push(esprima.parseScript('resolve(arrayData)'));
    functionStatement.body.body.push(prom);
    functionStatement.body.body.push({ type: esprima.Syntax.ReturnStatement, argument: { type: esprima.Syntax.Identifier, name: '(returnData)' } });
    if (callFunctionParams) {
      if (callFunctionParams.endsWith(',')) {
        callFunctionParams = callFunctionParams.substr(0, callFunctionParams.length - 1);
      }
      callFunctionParams = `${db}, ${callFunctionParams}`;
    } else {
      callFunctionParams = `${db}`;
    }
    const callStatement = this.createCallStatement(functionName, callFunctionParams, context, variableName); // esprima.parseScript(`${functionName}(${callFunctionParams})`);
    return { functionStatement, functionName, callStatement };
  }

  /**
   * return an array of json object include ast expressions.
   *
   * @param {*} params an array include ast expression such as limit(10), skip(100), etc.
   */
  getJsonExpression(params) {
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
  }

}

module.exports = {
  FindTranslator,
};
