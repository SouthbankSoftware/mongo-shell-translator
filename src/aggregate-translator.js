const commonTranslator = require('./common-translator');
const esprima = require('esprima');

const addPromiseToFunction = ({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam }) => {
  const prom = commonTranslator.getPromiseStatement('returnData');
  // add to promise callback
  const body = prom.body[0].declarations[0].init.arguments[0].body.body;
  let driverStatement = `const arrayData = useDb.collection('${collection}').${originFunName}(query`;
  if (extraParam) {
    driverStatement += `,${extraParam})`;
  } else {
    driverStatement += ')';
  }
  driverStatement += '.toArray()';
  body.push(esprima.parseScript(driverStatement));
  body.push(esprima.parseScript('resolve(arrayData)'));
  functionStatement.body.body.push(prom);
  functionStatement.body.body.push({ type: esprima.Syntax.ReturnStatement, argument: { type: esprima.Syntax.Identifier, name: '(returnData)' } });
  if (callFunctionParams) {
    callFunctionParams = `${db}, ${callFunctionParams}`;
  } else {
    callFunctionParams = `${db}`;
  }
};

const createCallStatement = (functionName, params) => {
  const script = `const results=${functionName}(${params}); \
  results.then((r) => { \
    r.forEach((doc) => {\
      console.log(JSON.stringify(doc));\
    });\
  });`;
  return esprima.parseScript(script);
};

const createParameterizedFunction = (statement, updateExpression, params, context, originFunName) => {
  let { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams } = commonTranslator.createParameters(statement, updateExpression, originFunName, context);
  const functionStatement = commonTranslator.createFuncationStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd, callFunctionParams, db });
  addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam });
  const callStatement = createCallStatement(functionName, callFunctionParams);
  return { functionStatement, functionName, callStatement };
};

module.exports = {
  createParameterizedFunction,
};
