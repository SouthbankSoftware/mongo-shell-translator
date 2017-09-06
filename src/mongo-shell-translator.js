import { createFindStatement, findDbName } from './find-translator';
import generate from './code-generator';

const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

class MongoShellTranslator {

  translate(shell) {
    const ast = esprima.parseScript(shell, {
      tolerant: true,
      raw: true,
      tokens: true,
      range: true,
      comment: true,
    });
    estraverse.traverse(ast, {
      enter: (node, parent) => {
        if (node.type === esprima.Syntax.CallExpression) {
          const callee = node.callee;
          if (callee.type === esprima.Syntax.MemberExpression &&
            callee.property.name === 'find') {
            node.mongoShellType = 'find';
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
              callee.object = createFindStatement(findDbName(node), callee.object.property.name);
            }
            if (parent.type === esprima.Syntax.VariableDeclarator ||
              parent.type === esprima.Syntax.ExpressionStatement) {
              if (!node.property) {
                node.type = esprima.Syntax.CallExpression;
                node.callee = {
                  type: esprima.Syntax.MemberExpression,
                  object: { ...node },
                  property: { type: esprima.Syntax.Identifier, name: 'toArray' },
                };
                node.arguments = [];
                console.log('new node', node);
              }
            }
          }
        }
      },
      leave: (node, parent) => {},
    });
    return generate(ast);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
