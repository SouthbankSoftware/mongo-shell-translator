import commonTranslator from './common-translator';
import findTranslator from './find-translator';
import findOneTranslator from './find-one-translator';
import updateTranslator from './update-translator';
import deleteTranslator from './delete-translator';
import insertTranslator from './insert-translator';
import generate from './code-generator';
import { parseOptions, commandName } from './options';

const esprima = require('esprima');
const estraverse = require('estraverse');

const translators = {
  [commandName.find]: findTranslator,
  [commandName.findOne]: findOneTranslator,
  [commandName.findOneAndDelete]: findOneTranslator,
  [commandName.findOneAndReplace]: findOneTranslator,
  [commandName.findOneAndUpdate]: findOneTranslator,
  [commandName.aggregate]: commonTranslator,
  [commandName.deleteMany]: deleteTranslator,
  [commandName.deleteOne]: deleteTranslator,
  [commandName.update]: updateTranslator,
  [commandName.updateOne]: updateTranslator,
  [commandName.updateMany]: updateTranslator,
  [commandName.insert]: insertTranslator,
  [commandName.insertOne]: insertTranslator,
  [commandName.insertMany]: insertTranslator,
};

class MongoShellTranslator {

  constructor(stype) {
    this.statementType = '';
    this.sType = stype;
  }

  translate(shell) {
    const ast = esprima.parseScript(shell, parseOptions);

    console.log('ast =', ast);
    const statements = ast.body;
    const newAst = { type: 'Program', body: [] };
    statements.forEach((statement) => {
      switch (statement.type) {
        case esprima.Syntax.ExpressionStatement:
          const callee = statement.expression.callee;
          if (statement.expression.type === esprima.Syntax.CallExpression &&
            callee.type === esprima.Syntax.MemberExpression &&
            callee.property && callee.property.type === esprima.Syntax.Identifier) {
            const translator = translators[callee.property.name];
            if (translator) {
              const s = translator.createParameterizedFunction(statement);
              newAst.body.push(s);
            }
          }
          break;
        case esprima.Syntax.VariableDeclaration:
        default:
          // skip parsing it
      }
    });
    console.log('new ast ', newAst);
    return generate(newAst, shell);
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
