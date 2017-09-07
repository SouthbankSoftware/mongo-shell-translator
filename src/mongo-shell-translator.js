import findTranslator from './find-translator';
import generate from './code-generator';
import options from './options';

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const parseOptions = {
  tolerant: true,
  raw: true,
  tokens: true,
  range: true,
  comment: true,
};

class MongoShellTranslator {

  constructor() {
    this.statementType = '';
  }

  translate(shell) {
    const ast = esprima.parseScript(shell, parseOptions);
    estraverse.traverse(ast, {
      enter: (node, parent) => {
        if (node.type === esprima.Syntax.CallExpression) {
          const callee = node.callee;
          if (callee.type === esprima.Syntax.MemberExpression &&
            callee.property.name === 'find') {
            this.statementType = 'find';
            let query;
            let fields;
            if (node.arguments.length > 0) {
              node.arguments.forEach((argument, i) => {
                if (i === 0) {
                  query = escodegen.generate(argument);
                } else if (i === 1) {
                  fields = escodegen.generate(argument);
                }
              });
            }
            if (callee.object.type === esprima.Syntax.MemberExpression) {
              callee.object = findTranslator.createFindStatement(findTranslator.findDbName(node), callee.object.property.name);
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
            const statement = findTranslator.getToArrayStatement(node);
            if (statement) {
              if (node.type === esprima.Syntax.VariableDeclarator) {
                statement.callee.object = node.init;
                node.init = statement;
              } else if (node.type === esprima.Syntax.AssignmentExpression) {
                statement.callee.object = node.right;
                node.right = statement;
              } else {
                statement.callee.object = node.expression;
                node.expression = statement;
              }
            } else if (node.type === esprima.Syntax.VariableDeclarator) {
              node.init.arguments = [findTranslator.getCallbackStatement(options.syntaxType.callback)];
            } else if (node.type === esprima.Syntax.AssignmentExpression) {
              node.right.arguments = [findTranslator.getCallbackStatement(options.syntaxType.callback)];
            } else {
              node.expression.arguments = [findTranslator.getCallbackStatement(options.syntaxType.callback)];
            }
          }
        }
      },
    });
    return generate(ast);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
