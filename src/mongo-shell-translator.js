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

  constructor(stype) {
    this.statementType = '';
    this.sType = stype;
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
            findTranslator.addCallbackOnStatement(node, this.stype);
          }
        }
      },
    });
    return generate(ast);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
