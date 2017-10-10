import { commandName } from './options';

const commonTranslator = require('./common-translator');
const esprima = require('esprima');

class SimpleTranslator extends commonTranslator.CommonTranslator {
  createParameterizedFunction(statement, expression, params, context, originFunName) {
    let { db, functionName, callFunctionParams, collection, extraParam, functionParams } = this.createParameters(statement, expression, originFunName, context);
    const functionStatement = this.createFuncationStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd: null, callFunctionParams, db });
    this.addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam, queryName: '' });
    const callStatement = this.createCallStatement(functionName, callFunctionParams);
    return { functionStatement, functionName, callStatement };
  }
}

module.exports = { SimpleTranslator };
