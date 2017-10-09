const translator = require('./common-translator');
const CommonTranslator = require('./common-translator').CommonTranslator;
const argumentCreator = require('./argument-creator');
const template = require('./template-ast');
const esprima = require('esprima');
const escodegen = require('escodegen');
const parameterParser = require('./parameter-parser');


class FindOneTranslator extends CommonTranslator {
  createCallStatement(functionName, params) {
    const script = `const results=${functionName}(${params}); \
  results.then((r) => { \
          console.log(JSON.stringify(r));\
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
   */
  createParameterizedFunction(statement, findExpression, params, context, originFunName) {
    const db = translator.findDbName(statement);
    const collection = translator.findCollectionName(statement);
    const functionName = context.getFunctionName(`${collection}FindOne`);
    const args = findExpression.arguments;
    const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
    let queryCmd = '';
    let callFunctionParams = '';
    if (args.length > 0) {
      const pNum = parameterParser.getParameterNumber(args[0]);
      if (pNum <= 4) {
        const { queryObject, parameters } = parameterParser.parseQueryParameters(args[0]);
        queryCmd += `const query = ${queryObject}`;
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
      projections = `{fields: ${escodegen.generate(args[1])}}`;
    }
    const functionStatement = template.buildFunctionTemplate(functionName, functionParams);
    const prom = this.getPromiseStatement('returnData');
    const body = prom.body[0].declarations[0].init.arguments[0].body.body;
    if (context.currentDB) {
      functionStatement.body.body.push(esprima.parseScript(`const useDb = db.db("${context.currentDB}")`).body[0]);
    } else {
      functionStatement.body.body.push(esprima.parseScript('const useDb = db').body[0]);
    }
    queryCmd && functionStatement.body.body.push(esprima.parseScript(queryCmd).body[0]);
    let queryStatement = `const arrayData = useDb.collection('${collection}').${originFunName}(query`;
    if (projections) {
      queryStatement += `, ${projections})`;
    } else {
      queryStatement += ')';
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
    const callStatement = this.createCallStatement(functionName, callFunctionParams, context); // esprima.parseScript(`${functionName}(${callFunctionParams})`);
    return { functionStatement, functionName, callStatement };
  }

  createCollectionStatement(node, dbName, colName) {
    const statement = translator.createCollectionStatement(node, dbName, colName);
    return Object.assign(statement, { arguments: argumentCreator.createArguments(node, 0, 1) });
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
  FindOneTranslator,
};
