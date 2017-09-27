const translator = require('./common-translator');
const esprima = require('esprima');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');
const escodegen = require('escodegen');

const getFunctionName = (arg) => {
  let functionName = 'insert';
  if (arg) {
    if (arg.type === esprima.Syntax.ArrayExpression) {
      functionName = 'insertMany';
    } else {
      functionName = 'insertOne';
    }
  }
  return functionName;
};

const createPromiseStatement = (collection, funName, extraParam) => {
  const prom = translator.getPromiseStatement('returnData');
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
};

const createCallStatement = (functionName, params) => {
  const script = `const results=${functionName}(${params}); \
  results.then((r) => { \
      console.log(JSON.stringify(r));\
  });`;
  return esprima.parseScript(script);
};

/**
 * create parameterized function
 *
 * @param {*} statement
 * @param {*} updateExpression the update expression inside the statement
 */
const createParameterizedFunction = (statement, updateExpression, params, context, originFunName) => {
  const db = translator.findDbName(statement);
  const collection = translator.findCollectionName(statement);
  const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
  const args = updateExpression.arguments;
  const options = args.length > 2 ? args[2] : null;
  const firstArg = args.length > 0 ? args[0] : null;
  const driverFunctionName = originFunName === 'insert' ? getFunctionName(firstArg) : originFunName;
  let functionName = `${collection}${driverFunctionName}`;
  let extraParam = '';
  if (driverFunctionName === 'insertOne') {
    functionName = `${collection}InsertOne`;
  } else if (driverFunctionName === 'insertMany') {
    functionName = `${collection}InsertMany`;
  }
  functionName = context.getFunctionName(functionName);
  let insertDoc = '';
  let callFunctionParams = ''; // the parameters we need to put on calling the generated function

  if (args.length > 0) {
    const pNum = parameterParser.getParameterNumber(args[0]);
    if (pNum <= 4) {
      const { queryObject, parameters } = parameterParser.parseQueryParameters(args[0]);
      insertDoc += `const doc = ${queryObject}`;
      parameters.forEach((p) => {
        functionParams.push({ type: esprima.Syntax.Identifier, name: p.name });
        callFunctionParams += p.value;
        callFunctionParams += ',';
      });
    } else {
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
      const { queryObject, parameters } = parameterParser.parseQueryManyParameters(args[0]);
      insertDoc += `const doc = ${queryObject}`;
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
  functionStatement.body.body.push(createPromiseStatement(collection, driverFunctionName, extraParam));
  functionStatement.body.body.push({ type: esprima.Syntax.ReturnStatement, argument: { type: esprima.Syntax.Identifier, name: '(returnData)' } });
  if (callFunctionParams) {
    callFunctionParams = `${db}, ${callFunctionParams}`;
  } else {
    callFunctionParams = `${db}`;
  }
  const callStatement = createCallStatement(functionName, callFunctionParams);
  return { functionStatement, functionName, callStatement };
};

module.exports = {
  createParameterizedFunction,
};
