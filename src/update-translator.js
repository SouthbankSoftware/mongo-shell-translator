const CommonTranslator = require('./common-translator').CommonTranslator;
const esprima = require('esprima');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');
const escodegen = require('escodegen');
const getSeparator = require('./utils').getSeparator;

class UpdateTranslator extends CommonTranslator {
  getFunctionName(options) {
    let functionName = 'updateOne';
    options && options.properties && options.properties.forEach((property) => {
      if (property.type === esprima.Syntax.Property && property.key.type === esprima.Syntax.Identifier &&
        property.key.name === 'multi' && property.value.value === true) {
        functionName = 'updateMany';
      }
    });
    return functionName;
  }

  createPromise(db, collection, functionName, options) {
    const prom = this.getPromiseStatement('returnData');
    const body = prom.body[0].declarations[0].init.arguments[0].body.body;
    let queryStatement;
    if (!options) {
      queryStatement = `const data = ${db}.collection('${collection}').${functionName}(query, update)`;
    } else {
      queryStatement = `const data = ${db}.collection('${collection}').${functionName}(query, update, options)`;
    }
    body.push(esprima.parseScript(queryStatement));
    body.push(esprima.parseScript('resolve(data)'));
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
    const driverFunctionName = originFunName === 'update' ? this.getFunctionName(options) : originFunName;
    let functionName = `${collection}${driverFunctionName}`;
    if (driverFunctionName === 'updateOne') {
      functionName = `${collection}UpdateOne`;
    } else if (driverFunctionName === 'updateMany') {
      functionName = `${collection}UpdateMany`;
    }
    functionName = context.getFunctionName(functionName);
    let updateCmd = '';
    let callFunctionParams = ''; // the parameters we need to put on calling the generated function

    if (args.length > 1) {
      let pNum = 0;
      args.slice(0, 2).forEach((arg) => {
        pNum += parameterParser.getParameterNumber(arg);
      });
      if (pNum <= 4) {
        const parseParameters = (pName, arg, end = false, updateValue = false) => {
          const { queryObject, parameters } = parameterParser.parseQueryParameters(arg, updateValue ? 'Updated' : '');
          updateCmd += `const ${pName} = ${queryObject}${getSeparator()}`;

          parameters.forEach((p, i) => {
            functionParams.push({ type: esprima.Syntax.Identifier, name: updateValue ? `${p.name}Updated` : p.name });
            callFunctionParams += p.value;
            if (!end || i !== parameters.length - 1) {
              callFunctionParams += ',';
            }
          });
        };
        parseParameters('query', args[0]);
        parseParameters('update', args[1], true, true);
      } else {
        functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
        functionParams.push({ type: esprima.Syntax.Identifier, name: 'u' });
        let { queryObject, parameters } = parameterParser.parseQueryManyParameters(args[0]);
        updateCmd += `const query = ${queryObject}${getSeparator()}`;
        queryObject = parameterParser.parseQueryManyParameters(args[1], 'Updated').queryObject;
        updateCmd += `const update = ${queryObject}`;
        callFunctionParams = '{';
        parameters.forEach((p) => {
          callFunctionParams += `'${p.name}':${p.value},`;
        });
        callFunctionParams += '},{';
        parameters = parameterParser.parseQueryManyParameters(args[1], 'Updated').parameters;
        parameters.forEach((p) => {
          callFunctionParams += `'${p.name}Updated':${p.value},`;
        });
        callFunctionParams += '}';
      }
    } else {
      updateCmd = 'const query = {}';
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
    if (updateCmd) {
      functionStatement.body.body = functionStatement.body.body.concat(esprima.parseScript(updateCmd).body);
    }
    functionStatement.body.body.push(this.createPromise('useDb', collection, driverFunctionName, options));
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
  UpdateTranslator,
};
