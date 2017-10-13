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
      driverStatement = 'const ret = useDb.dropCollection(collectionName)';
    }
    body.push(esprima.parseScript(driverStatement));
    body.push(esprima.parseScript('resolve(ret)'));
    return prom;
  }

  createParameterizedFunction(statement, expression, params, context, originFunName, variableName) {
    let { db, functionName, callFunctionParams, collection, extraParam, functionParams } = this.createParameters(statement, expression, originFunName, context);
    if (originFunName === commandName.drop) {
      functionName = 'dropCollection';
      functionParams.push({ type: esprima.Syntax.Identifier, name: 'collectionName' });
      callFunctionParams += ` '${collection}',`;
    } else if (originFunName === commandName.dropDatabase) {
      functionName = 'dropDatabase';
    }
    const functionStatement = this.createFunctionStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd: null, callFunctionParams, db });
    this.addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam, queryName: '' });
    const callStatement = this.createCallStatement(functionName, callFunctionParams, variableName);
    return { functionStatement, functionName, callStatement };
  }

}

module.exports = { DropTranslator };
