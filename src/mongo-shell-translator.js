import commonTranslator from './common-translator';
import findTranslator from './find-translator';
import findOneTranslator from './find-one-translator';
import updateTranslator from './update-translator';
import deleteTranslator from './delete-translator';
import insertTranslator from './insert-translator';
import generate from './code-generator';
import { parseOptions, commandName } from './options';
import Context from './context';

const esprima = require('esprima');
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

  constructor(stype, connection) {
    this.sType = stype;
    this.connection = connection;
  }

  createConnectionStatement() {
    if (this.connection) {

    }
  }

  /**
   * filter out the mongo commands which are invalid javascript
   */
  preProcess(scripts) {
    if (scripts) {
      const splitted = scripts.split(commonTranslator.getSeparator());
      const filtered = splitted.map((statement) => {
        const pattern = /^[^\S\x0a\x0d]*(?:use[\s]*)([\S]*)/gm;
        let m = pattern.exec(statement);
        if (m) {
          if (m.length >= 2 && m[1]) {
            return `dbKoda_USE_DATABASE_NAME(${m[1]})`;
          }
          return '';
        }
        const ignore = /^[^\S\x0a\x0d]*(?:show|help|it|exit[\s]*)([\S]*)/gm;
        m = ignore.exec(statement);
        if (m) {
          return '';
        }
        return statement;
      });
      return filtered.join(commonTranslator.getSeparator());
    }
    return scripts;
  }

  translate(shell) {
    if (!shell) {
      return '';
    }
    const filtered = this.preProcess(shell);
    console.log('filtered:', filtered);
    const context = new Context();
    let ast = esprima.parseScript(filtered, parseOptions);
    ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
    const statements = ast.body;
    const newAst = { type: 'Program', body: [] };
    statements.forEach((statement) => {
      if (statement.type === esprima.Syntax.ExpressionStatement && statement.expression.type === esprima.Syntax.CallExpression &&
        statement.expression.callee.type === esprima.Syntax.Identifier && statement.expression.callee.name === 'dbKoda_USE_DATABASE_NAME') {
        if (
          statement.expression.arguments && statement.expression.arguments.length > 0 &&
          statement.expression.arguments[0].type === esprima.Syntax.Identifier) {
          context.currentDB = statement.expression.arguments[0].name;
        }
      } else {
        const { name, expression, params } = commonTranslator.findSupportedStatement(statement);
        if (name) {
          const translator = translators[name];
          if (translator) {
            const { functionStatement, callStatement } = translator.createParameterizedFunction(statement, expression, params, context);
            newAst.body.push(functionStatement);
            if (callStatement) {
              newAst.body.push(callStatement);
            }
          }
        } else {
          newAst.body.push(statement);
        }
      }
    });
    console.log('new ast ', newAst);
    const code = generate(newAst);
    console.log('generated:', code);
    return code;
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
