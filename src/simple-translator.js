import { commandName } from './options';

const commonTranslator = require('./common-translator');
const esprima = require('esprima');

const functionNameMap = { print: 'console.log' };

class SimpleTranslator extends commonTranslator.CommonTranslator {


  createParameterizedFunction(statement, expression, params, context, originFunName) {
    let functionName;
    if (functionNameMap[originFunName]) {
      functionName = functionNameMap[originFunName];
    } else {
      functionName = originFunName;
    }
    const exp = {
      type: esprima.Syntax.ObjectExpression,
      value: {
        type: esprima.Syntax.ExpressionStatement,
        expression: {
          type: esprima.Syntax.CallExpression,
          arguments: params,
          callee: { type: esprima.Syntax.Identifier, name: functionName },
        },
      },
    };
    return { functionName, expression: exp };
  }
}

module.exports = { SimpleTranslator };
