const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

class MongoShellTranslator {

  translate(shell) {
    console.log('esprima', esprima);
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
          if (node.callee.type === esprima.Syntax.MemberExpression &&
            node.callee.property.name === 'find') {
            node.mongoShellType = 'find';
            let query;
            let fields;
            if (node.arguments.length > 0) {
              node.arguments.map((argument, i) => {
                if (i === 0) {
                  query = escodegen.generate(argument);
                } else if (i === 1) {
                  fields = escodegen.generate(argument);
                }
              });
            }
            if (callee.object.type === esprima.Syntax.MemberExpression) {
              const object = {};
              object.type = esprima.Syntax.CallExpression;
              object.arguments = [{ type: 'Literal', value: callee.object.property.name }];
              object.callee = {};
              object.callee.type = esprima.Syntax.MemberExpression;
              object.callee.property = {};
              object.callee.property.name = 'collection';
              object.callee.property.type = esprima.Syntax.Identifier;
              object.callee.object = {};
              object.callee.object.name = 'db';
              object.callee.object.type = esprima.Syntax.Identifier;
              callee.object = object;
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
      leave: (node, parent) => {
        if (node.type === esprima.Syntax.CallExpression) {
          if (node.mongoShellType === 'find') {

          }
        }
      },
    });
    return escodegen.generate(ast);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
