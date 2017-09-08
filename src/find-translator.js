import { syntaxType } from './options';

const commonTranslator = require('./common-translator');
const esprima = require('esprima');
const escodegen = require('escodegen');


/**
 * add toArray statement at the end of find statement.
 * @param node
 */
const getToArrayStatement = (node, syntax) => {
  const statement = escodegen.generate(node);
  if (!statement.trim().endsWith('toArray();') && !statement.trim().endsWith('toArray()')) {
    return {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: null,
        property: {
          type: 'Identifier',
          name: 'toArray',
        },
      },
      arguments: syntax === syntaxType.callback ? [commonTranslator.getCallbackArguments(true)] : [],
    };
  }
  return null;
};


/**
 * add callback on the statement. It can be callback, promise or await/sync
 * @param {*} node
 * @param {*} syntax
 */
const addCallbackOnStatement = (node, syntax) => {
  let statement;
  switch (syntax) {
    case syntaxType.await:
      statement = getToArrayStatement(node, syntax);
      commonTranslator.wrapStatementOnNode(node, statement);
      statement = commonTranslator.getAwaitStatement();
      if (node.type === esprima.Syntax.VariableDeclarator) {
        statement.argument = node.init;
        node.init = statement;
      } else if (node.type === esprima.Syntax.AssignmentExpression) {
        statement.argument = node.right;
        node.right = statement;
      } else {
        statement.argument = node.expression;
        node.expression = statement;
      }
      break;
    case syntaxType.promise:
      statement = getToArrayStatement(node, syntax);
      commonTranslator.wrapStatementOnNode(node, statement);
      statement = commonTranslator.getThenPromise(node, syntax);
      commonTranslator.wrapStatementOnNode(node, statement);
      commonTranslator.addNodeArguments(node);
      break;
    default:
      statement = getToArrayStatement(node, syntax);
      commonTranslator.wrapStatementOnNode(node, statement);
      commonTranslator.addNodeArguments(node, true);
  }
};

module.exports = {
  getToArrayStatement,
  addCallbackOnStatement,
};
