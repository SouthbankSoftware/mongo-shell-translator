const commonTranslator = require('./common-translator');

const createParameterizedFunction = (statement, updateExpression, params, context, originFunName) => {
  let { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams } = createParameters(statement, updateExpression, originFunName, context);
};

module.exports = {
  createParameterizedFunction,
};
