import commonTranslator from './common-translator';
import findTranslator from './find-translator';
import updateTranslator from './update-translator';
import deleteTranslator from './delete-translator';
import generate from './code-generator';
import { parseOptions, commandName } from './options';

const esprima = require('esprima');
const estraverse = require('estraverse');

const translators = {
  [commandName.find]: findTranslator,
  [commandName.aggregate]: commonTranslator,
  [commandName.deleteMany]: deleteTranslator,
  [commandName.deleteOne]: deleteTranslator,
  [commandName.update]: updateTranslator,
  [commandName.updateOne]: updateTranslator,
  [commandName.updateMany]: updateTranslator,
};

class MongoShellTranslator {

  constructor(stype) {
    this.statementType = '';
    this.sType = stype;
  }

  translate(shell) {
    const ast = esprima.parseScript(shell, parseOptions);
    estraverse.traverse(ast, {
      cursor: 0,
      enter: (node, parent) => {
        if (node.type === esprima.Syntax.CallExpression) {
          const callee = node.callee;
          if (callee.type === esprima.Syntax.MemberExpression) {
            if (callee.property.name === commandName.find) {
              this.statementType = callee.property.name;
              if (callee.object.type === esprima.Syntax.MemberExpression) {
                const statementObj = findTranslator.createCollectionStatement(node,
                  commonTranslator.findDbName(node), callee.object.property.name);
                callee.object = statementObj.object;
                node.arguments = statementObj.arguments;
              }
            } else if (callee.property.name === commandName.aggregate) {
              this.statementType = commandName.aggregate;
              if (callee.object.type === esprima.Syntax.MemberExpression) {
                const statementObj = commonTranslator.createCollectionStatement(node,
                  commonTranslator.findDbName(node), callee.object.property.name);
                callee.object = statementObj.object;
                node.arguments = statementObj.arguments;
              }
            } else if (callee.property.name === commandName.update ||
              callee.property.name === commandName.updateOne ||
              callee.property.name === commandName.updateMany) {
              this.statementType = callee.property.name;
              if (callee.object.type === esprima.Syntax.MemberExpression) {
                const statementObj = updateTranslator.createCollectionStatement(node,
                  commonTranslator.findDbName(node), callee.object.property.name, parent);
                callee.object = statementObj.object;
                node.arguments = statementObj.arguments;
              }
            } else if (callee.property.name === commandName.deleteOne ||
              callee.property.name === commandName.deleteMany) {
              this.statementType = callee.property.name;
              if (callee.object.type === esprima.Syntax.MemberExpression) {
                const statementObj = deleteTranslator.createCollectionStatement(node,
                  commonTranslator.findDbName(node), callee.object.property.name);
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
          if (this.statementType === commandName.find ||
            this.statementType === commandName.aggregate ||
            this.statementType === commandName.deleteMany ||
            this.statementType === commandName.deleteOne
          ) {
            this.statementType = '';
            commonTranslator.addCallbackOnStatement(node, this.sType);
          } else if (this.statementType === commandName.updateOne ||
            this.statementType === commandName.updateMany ||
            this.statementType === commandName.update) {
            this.statementType = '';
            commonTranslator.addCallbackOnStatement(node, this.sType, false, true, true, 'r');
          }
        }
      },
    });
    return generate(ast, shell);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
