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
const escodegen = require('escodegen');

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
    let ast = esprima.parseScript(shell, parseOptions);
    ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
    console.log('ast =', ast);
    const statements = ast.body;
    const newAst = { type: 'Program', body: [] };
    statements.forEach((statement) => {
      const { name, expression, params } = commonTranslator.findSupportedStatement(statement);
      if (name) {
        const translator = translators[name];
        if (translator) {
          const tran = translator.createParameterizedFunction(statement, expression, params);
          newAst.body.push(tran);
        }
      } else {
        newAst.body.push(statement);
      }
    });
    console.log('new ast ', newAst);
    const code = generate(newAst, shell);
    console.log('generated:', code);
    return code;
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
