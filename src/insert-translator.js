const CommonTranslator = require('./common-translator').CommonTranslator;
const esprima = require('esprima');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');
const escodegen = require('escodegen');

class InsertTranslator extends CommonTranslator {
  getFunctionName(arg) {
    let functionName = 'insert';
    if (arg) {
      if (arg.type === esprima.Syntax.ArrayExpression) {
        functionName = 'insertMany';
      } else if (arg.type === esprima.Syntax.ObjectExpression) {
        functionName = 'insertOne';
      }
    }
    return functionName;
  }

  createPromiseStatement(collection, funName, extraParam) {
    const prom = this.getPromiseStatement('returnData');
    // add to promise callback
    const body = prom.body[0].declarations[0].init.arguments[0].body.body;
    let driverStatement = `const arrayData = useDb.collection('${collection}').${funName}(doc`;
    if (extraParam) {
      driverStatement += `,${extraParam})`;
    } else {
      driverStatement += ')';
    }
    body.push(esprima.parseScript(driverStatement));
    body.push(esprima.parseScript('resolve(arrayData)'));
    return prom;
  }

  createCallStatement(functionName, params, variableName = 'r') {
    let results = 'results';
    if (variableName === 'results') {
      results += '1';
    }
    const script = `const ${results}=${functionName}(${params}); \
  ${results}.then((${variableName}) => { \
      console.log(JSON.stringify(${variableName}));\
  }).catch(err => console.error(err));`;
    return esprima.parseScript(script);
  }

  /**
   * create parameterized function
   *
   * @param {*} statement
   * @param {*} updateExpression the update expression inside the statement
   */
  createParameterizedFunction(statement, updateExpression, params, context, originFunName, variableName) {
    const db = this.findDbName(statement);
    const collection = this.findCollectionName(statement);
    const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
    const args = updateExpression.arguments;
    const options = args.length > 2 ? args[2] : null;
    const firstArg = args.length > 0 ? args[0] : null;
    const driverFunctionName = originFunName === 'insert' ? this.getFunctionName(firstArg) : originFunName;
    let functionName = `${collection}${driverFunctionName}`;
    let extraParam = '';
    if (driverFunctionName === 'insertOne') {
      functionName = `${collection}InsertOne`;
    } else if (driverFunctionName === 'insertMany') {
      functionName = `${collection}InsertMany`;
    } else {
      functionName = `${collection}Insert`;
    }
    functionName = context.getFunctionName(functionName);
    let insertDoc = '';
    let callFunctionParams = ''; // the parameters we need to put on calling the generated function
    if (args.length > 0) {
      if (args[0].type === esprima.Syntax.ArrayExpression) {
        const arrayParam = parameterParser.parseArrayParameters(args[0]);
        insertDoc += 'const doc = [';
        arrayParam.forEach((param, i) => {
          let { parameters } = param;
          if (parameters.length > 0) {
            insertDoc += `doc${i + 1},`;
            functionParams.push({ type: esprima.Syntax.Identifier, name: `doc${i + 1}` });
            callFunctionParams += `${escodegen.generate(args[0].elements[i])},`;
          }
        });
        insertDoc += ']';
      } else {
        let { queryObject, parameters } = parameterParser.parseQueryParameters(args[0]);
        if (parameters.length === 0) {
          callFunctionParams += `${queryObject},`;
          functionParams.push({ type: esprima.Syntax.Identifier, name: 'd' });
          insertDoc += 'const doc = d';
        } else {
          insertDoc += `const doc = ${queryObject}`;
        }
        const existedParam = {};
        parameters.forEach((p) => {
          if (existedParam[p.name] === undefined) {
            existedParam[p.name] = 0;
          } else {
            existedParam[p.name] += 1;
          }
          let nameSuf = '';
          if (existedParam[p.name] > 0) {
            nameSuf += existedParam[p.name];
          }
          functionParams.push({ type: esprima.Syntax.Identifier, name: p.name + nameSuf });
          callFunctionParams += p.value;
          callFunctionParams += ',';
        });
        args.slice(1).forEach((arg, i) => {
          functionParams.push({ type: esprima.Syntax.Identifier, name: `arg${i + 1}` });
          extraParam += `${escodegen.generate(arg)},`;
        });
        callFunctionParams += extraParam;
      }
    } else {
      insertDoc = 'const doc = {}';
    }
    if (options) {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'options' });
      callFunctionParams += `, ${escodegen.generate(options)}`;
    }
    const functionStatement = template.buildFunctionTemplate(functionName, functionParams);
    if (context.currentDB) {
      functionStatement.body.body.push(esprima.parseScript(`const useDb = db.db("${context.currentDB}")`).body[0]);
    } else {
      functionStatement.body.body.push(esprima.parseScript('const useDb = db').body[0]);
    }
    if (insertDoc) {
      functionStatement.body.body = functionStatement.body.body.concat(esprima.parseScript(insertDoc).body);
    }
    functionStatement.body.body.push(this.createPromiseStatement(collection, driverFunctionName, extraParam));
    functionStatement.body.body.push({ type: esprima.Syntax.ReturnStatement, argument: { type: esprima.Syntax.Identifier, name: '(returnData)' } });
    if (callFunctionParams) {
      callFunctionParams = `${db}, ${callFunctionParams}`;
    } else {
      callFunctionParams = `${db}`;
    }
    const callStatement = this.createCallStatement(functionName, callFunctionParams, variableName);
    return { functionStatement, functionName, callStatement };
  }

}

module.exports = {
  InsertTranslator,
};
