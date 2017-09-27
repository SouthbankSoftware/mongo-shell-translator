import commonTranslator from './common-translator';
import findTranslator from './find-translator';
import findOneTranslator from './find-one-translator';
import updateTranslator from './update-translator';
import insertTranslator from './insert-translator';
import generate from './code-generator';
import { parseOptions, commandName } from './options';
import Context from './context';
import _ from 'lodash';

const esprima = require('esprima');
const escodegen = require('escodegen');

const translators = {
  [commandName.find]: findTranslator,
  [commandName.findOne]: findOneTranslator,
  [commandName.findOneAndDelete]: findOneTranslator,
  [commandName.findOneAndReplace]: findOneTranslator,
  [commandName.findOneAndUpdate]: findOneTranslator,
  [commandName.aggregate]: commonTranslator,
  [commandName.deleteMany]: commonTranslator,
  [commandName.deleteOne]: commonTranslator,
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
    this.translatedStatements = [];
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

  addStatement(statement) {
    if (statement.type === esprima.Syntax.FunctionExpression) {
      const exps = _.filter(this.translatedStatements, { type: esprima.Syntax.FunctionExpression });
      let existed;
      if (exps) {
        exps.forEach((exp) => {
          if (_.isEqual(exp.function, statement.function)) {
            existed = exp;
          }
        });
      }
      if (!existed) {
        this.translatedStatements.push({
          type: statement.type,
          function: statement.function,
          translatorName: statement.translatorName,
          functionName: statement.functionName,
          call: [statement.call],
        });
      } else {
        existed.call.push(statement.call);
      }
    } else {
      this.translatedStatements.push(statement);
    }
  }

  createStatementAfterPromise(name, promiseExpression, paramName) {
    const newExp = {
      type: esprima.Syntax.CallExpression,
      callee: {
        type: esprima.Syntax.MemberExpression,
        object: promiseExpression,
        property: {
          type: esprima.Syntax.Identifier,
          name,
        },
      },
      arguments: [{
        type: esprima.Syntax.ArrowFunctionExpression,
        params: [{
          type: esprima.Syntax.Identifier,
          name: paramName,
        }],
        body: {
          type: esprima.Syntax.BlockStatement,
          body: [],
        },
      }],
    };
    return newExp;
  }

  createPromiseChain() {
    const statements = [];
    const exps = _.filter(this.translatedStatements, { type: esprima.Syntax.FunctionExpression });
    if (exps.length > 1) {
      // declare all functions first
      exps.forEach((exp) => {
        statements.push(exp.function);
      });
      // chain the promise calls
      const promiseStatement = esprima.parseScript('new Promise((resolve) => {})');
      let promiseExpression = promiseStatement.body[0].expression;
      let promiseBody = promiseExpression.arguments[0].body.body;
      let firstStat = true;
      this.translatedStatements.forEach((exp) => {
        if (exp.type === esprima.Syntax.FunctionExpression) {
          exp.call.forEach((c) => {
            promiseBody.push(c.body[0]);
            const resultName = c.body[0].declarations[0].id.name;
            if (firstStat) {
              firstStat = false;
              promiseBody.push(esprima.parseScript(`resolve(${resultName})`).body[0]);
            } else {
              promiseBody.push(esprima.parseScript(`function a(){ return ${resultName}}`).body[0].body.body[0]);
            }
            const newExp = this.createStatementAfterPromise('then', promiseExpression, 'r');
            promiseStatement.body[0].expression = newExp;
            promiseExpression = newExp;
            promiseBody = newExp.arguments[0].body.body;
            if (c.body[1].type === esprima.Syntax.ExpressionStatement) {
              const st = c.body[1].expression.arguments[0].body.body[0];
              promiseBody.push(st);
            }
          });
        } else {
          promiseBody.push(exp.value);
        }
      });
      // add catch
      const catchExp = this.createStatementAfterPromise('catch', promiseStatement.body[0].expression, 'err');
      promiseStatement.body[0].expression = catchExp;
      catchExp.arguments[0].body.body.push(esprima.parseScript('console.error(err)').body[0]);
      statements.push(promiseStatement);
    } else if (exps.length === 1) {
      this.translatedStatements.forEach((statement) => {
        if (statement.type === esprima.Syntax.FunctionExpression) {
          statements.push(statement.function);
          statement.call.forEach((call) => {
            if (call) {
              statements.push(call);
            }
          });
        } else {
          statements.push(statement.value);
        }
      });
    }
    return statements;
  }

  generateCode() {
    const newAst = { type: 'Program', body: [] };
    const exps = _.filter(this.translatedStatements, { type: esprima.Syntax.FunctionExpression });
    const existedFunName = [];
    const allFunNames = {};
    exps.forEach((exp) => {
      if (existedFunName.indexOf(exp.functionName) >= 0) {
        exp.function.id.name = exp.function.id.name + (allFunNames[exp.functionName]);
        allFunNames[exp.functionName] += 1;
        exp.call.forEach((c) => {
          if (c.body[0].type === esprima.Syntax.VariableDeclaration) {
            c.body[0].declarations[0].init.callee.name = exp.function.id.name;
          }
        });
      } else {
        existedFunName.push(exp.functionName);
        allFunNames[exp.functionName] = 1;
      }
    });
    const statements = this.createPromiseChain();
    statements.forEach((s) => {
      newAst.body.push(s);
    });
    // this.translatedStatements.forEach((statement) => {
    //   if (statement.type === esprima.Syntax.FunctionExpression) {
    //     newAst.body.push(statement.function);
    //     statement.call.forEach((call) => {
    //       if (call) {
    //         newAst.body.push(call);
    //       }
    //     });
    //   } else {
    //     newAst.body.push(statement.value);
    //   }
    // });
    return generate(newAst);
  }

  translate(shell) {
    if (!shell) {
      return '';
    }
    const filtered = this.preProcess(shell);
    const context = new Context();
    let ast = esprima.parseScript(filtered, parseOptions);
    ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
    const statements = ast.body;
    statements.forEach((statement) => {
      if (statement.type === esprima.Syntax.ExpressionStatement && statement.expression.type === esprima.Syntax.CallExpression &&
        statement.expression.callee.type === esprima.Syntax.Identifier && statement.expression.callee.name === 'dbKoda_USE_DATABASE_NAME') {
        if (
          statement.expression.arguments && statement.expression.arguments.length > 0 &&
          statement.expression.arguments[0].type === esprima.Syntax.Identifier) {
          context.currentDB = statement.expression.arguments[0].name;
        }
      } else {
        context.numStatement += 1;
        const { name, expression, params, dbName } = commonTranslator.findSupportedStatement(statement);
        if (name) {
          const translator = translators[name];
          if (translator) {
            const currentDB = context.currentDB;
            if (dbName) {
              context.currentDB = dbName;
            }
            const { functionStatement, callStatement, functionName } = translator.createParameterizedFunction(statement, expression, params, context, name);
            if (dbName) {
              context.currentDB = currentDB;
            }
            this.addStatement({
              type: esprima.Syntax.FunctionExpression,
              function: functionStatement,
              translatorName: name,
              call: callStatement,
              functionName,
            });
          }
        } else {
          this.addStatement({ type: esprima.Syntax.ObjectExpression, value: statement });
        }
      }
    });
    return this.generateCode();
  }

}

module.exports.MongoShellTranslator = MongoShellTranslator;
