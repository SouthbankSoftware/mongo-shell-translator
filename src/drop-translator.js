import { commandName } from './options';

const commonTranslator = require('./common-translator');
const esprima = require('esprima');

class DropTranslator extends commonTranslator.CommonTranslator {

  createPromiseStatement(collection, funName) {
    const prom = this.getPromiseStatement('returnData');
    // add to promise callback
    const body = prom.body[0].declarations[0].init.arguments[0].body.body;
    let driverStatement;
    if (funName === commandName.dropDatabase) {
      driverStatement = `const ret = useDb.${commandName.dropDatabase}()`;
    } else {
      driverStatement = `const ret = useDb.dropCollection('${collection}')`;
    }
    body.push(esprima.parseScript(driverStatement));
    body.push(esprima.parseScript('resolve(ret)'));
    return prom;
  }

  createParameterizedFunction(statement, expression, params, context, originFunName) {
    let { db, functionName, callFunctionParams, collection, extraParam, functionParams } = this.createParameters(statement, expression, originFunName, context);
    const functionStatement = this.createFuncationStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd: null, callFunctionParams, db });
    this.addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam, queryName: '' });
    const callStatement = this.createCallStatement(functionName, callFunctionParams);
    return { functionStatement, functionName, callStatement };
  }

}
module.exports = { DropTranslator };
