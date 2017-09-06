import { createFindStatement, findDbName } from './find-translator';
import generate from './code-generator';

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
              callee.object = createFindStatement(findDbName(node), callee.object.property.name);
            }
            // if (parent.type === esprima.Syntax.VariableDeclarator ||
            //   parent.type === esprima.Syntax.ExpressionStatement) {
            //   if (!node.property) {
            //     node.type = esprima.Syntax.CallExpression;
            //     node.callee = {
            //       type: esprima.Syntax.MemberExpression,
            //       object: { ...node },
            //       property: { type: esprima.Syntax.Identifier, name: 'toArray' },
            //     };
            //     node.arguments = [];
            //   }
            // }
          }
        }
      },
      leave: (node, parent) => {
        if (node.type === esprima.Syntax.ExpressionStatement) {
          if (this.statementType === 'find') {
            this.statementType = '';
            let statement = escodegen.generate(node);
            console.log('statement = ', statement);
            if (!statement.trim().endsWith('toArray();')) {
              const idx = statement.lastIndexOf(';');
              statement = `${statement.substring(0, idx)}.toArray();`;
              const findAst = esprima.parse(statement, parseOptions);
              console.log('origin node ', node);
              console.log('new statement = ', statement);
              console.log('find ast ', findAst);
              if (findAst && findAst.type === esprima.Syntax.Program) {
                if (findAst.body && findAst.body.length > 0) {
                  node.expression.arguments = findAst.body[0].expression.arguments;
                  node.expression.callee = findAst.body[0].expression.callee;
                  node.expression.type = findAst.body[0].expression.type;
                }
              }
              console.log('new node ', node);
              console.log('updated node');
            }
          }
        }
      },
    });
    return generate(ast);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
