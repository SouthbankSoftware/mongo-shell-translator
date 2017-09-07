import findTranslator from './find-translator';
import generate from './code-generator';
import { parseOptions } from './options';

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

class MongoShellTranslator {

  constructor(stype) {
    this.statementType = '';
    this.sType = stype;
  }

  translate(shell) {
    const ast = esprima.parseScript(shell, parseOptions);
    estraverse.traverse(ast, {
      enter: (node) => {
        if (node.type === esprima.Syntax.CallExpression) {
          const callee = node.callee;
          if (callee.type === esprima.Syntax.MemberExpression &&
            callee.property.name === 'find') {
            this.statementType = 'find';
            if (callee.object.type === esprima.Syntax.MemberExpression) {
              const statementObj = findTranslator.createFindStatement(node, findTranslator.findDbName(node), callee.object.property.name);
              callee.object = statementObj.object;
              node.arguments = statementObj.arguments;
            }
          }
        }
      },
      leave: (node) => {
        if (node.type === esprima.Syntax.ExpressionStatement ||
          node.type === esprima.Syntax.VariableDeclarator ||
          node.type === esprima.Syntax.AssignmentExpression) {
          if (this.statementType === 'find') {
            this.statementType = '';
            findTranslator.addCallbackOnStatement(node, this.stype);
          }
        }
      },
    });
    return generate(ast, shell);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
