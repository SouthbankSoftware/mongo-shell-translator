import findTranslator from './find-translator';
import commonTranslator from './common-translator';
import generate from './code-generator';
import { parseOptions, commandName } from './options';

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
      cursor: 0,
      enter: (node) => {
        if (node.type === esprima.Syntax.CallExpression) {
          const callee = node.callee;
          if (callee.type === esprima.Syntax.MemberExpression) {
            if (callee.property.name === commandName.find) {
              this.statementType = commandName.find;
              if (callee.object.type === esprima.Syntax.MemberExpression) {
                const statementObj = commonTranslator.createCollectionStatement(node, commonTranslator.findDbName(node), callee.object.property.name);
                callee.object = statementObj.object;
                node.arguments = statementObj.arguments;
              }
            } else if (callee.property.name === commandName.aggregate) {
              this.statementType = commandName.aggregate;
              if (callee.object.type === esprima.Syntax.MemberExpression) {
                const statementObj = commonTranslator.createCollectionStatement(node, commonTranslator.findDbName(node), callee.object.property.name);
                callee.object = statementObj.object;
                node.arguments = statementObj.arguments;
              }
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
            findTranslator.addCallbackOnStatement(node, this.sType);
          }
        }
      },
    });
    return generate(ast, shell);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
