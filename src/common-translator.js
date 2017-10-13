const esprima = require('esprima');
const escodegen = require('escodegen');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');
const syntaxType = require('./options').syntaxType;

/**
 * define the general logic for parse a shell command
 */
class CommonTranslator {

  constructor(syntax = syntaxType.promise) {
    this.syntax = syntax;
  }

  /**
   * create parameterized function
   *
   * @param {*} statement the ast statement of this shell command
   * @param {*} updateExpression the update expression inside the statement
   */
  createParameterizedFunction(statement, updateExpression, params, context, originFunName, variableName) {
    let { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams } = this.createParameters(statement, updateExpression, originFunName, context);
    const functionStatement = this.createFunctionStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd, callFunctionParams, db });
    this.addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam, queryName: 'query' });
    const callStatement = this.createCallStatement(functionName, callFunctionParams, variableName);
    return { functionStatement, functionName, callStatement };
  }

  /**
   * create function parameters
   *
   * @param {*} statement the ast statement of this shell command
   * @param {*} updateExpression  the expression ast syntax of this shell command
   * @param {*} originFunName the original function name defined in shell
   * @param {*} context the context of this translator
   */
  createParameters(statement, updateExpression, originFunName, context, name, variable) {
    const db = this.findDbName(statement);
    const collection = this.findCollectionName(statement);
    const functionParams = [{ type: esprima.Syntax.Identifier, name: 'db' }];
    const args = updateExpression.arguments;
    const driverFunctionName = originFunName;
    let functionName = `${collection}${parameterParser.capitalizeFirst(driverFunctionName)}`;
    functionName = context.getFunctionName(functionName);
    let queryCmd = '';
    let callFunctionParams = `${db},`; // the parameters we need to put on calling the generated function
    let extraParam = '';
    if (args.length > 0) {
      const pNum = parameterParser.getParameterNumber(args[0]);
      if (pNum <= 4) {
        const { queryObject, parameters } = parameterParser.parseQueryParameters(args[0]);
        queryCmd += `const query = ${queryObject}`;
        if (parameters.length === 0) {
          callFunctionParams += `${queryObject},`;
        }
        parameters.forEach((p) => {
          functionParams.push({ type: esprima.Syntax.Identifier, name: p.name });
          callFunctionParams += p.value;
          callFunctionParams += ',';
        });
      } else {
        functionParams.push({ type: esprima.Syntax.Identifier, name: 'q' });
        const { queryObject, parameters } = parameterParser.parseQueryManyParameters(args[0]);
        queryCmd += `const query = ${queryObject}`;
        callFunctionParams = '{';
        parameters.forEach((p) => {
          callFunctionParams += `'${p.name}':${p.value},`;
        });
        callFunctionParams += '},';
      }
      args.slice(1).forEach((arg, i) => {
        functionParams.push({ type: esprima.Syntax.Identifier, name: `arg${i + 1}` });
        extraParam += `${escodegen.generate(arg)},`;
      });
      callFunctionParams += extraParam;
    } else {
      queryCmd = 'const query = {}';
    }
    return { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams };
  }

  /**
   * add promise on the function
   */
  addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam, queryName = 'query' }) {
    const prom = this.createPromiseStatement(collection, originFunName, extraParam, queryName);
    functionStatement.body.body.push(prom);

    functionStatement.body.body.push({ type: esprima.Syntax.ReturnStatement, argument: { type: esprima.Syntax.Identifier, name: '(returnData)' } });
    if (callFunctionParams) {
      callFunctionParams = `${db}, ${callFunctionParams}`;
    } else {
      callFunctionParams = `${db}`;
    }
  }

  /**
   * create funcation statement
   */
  createFunctionStatement({ context, functionName, functionParams, queryCmd }) {
    const functionStatement = template.buildFunctionTemplate(functionName, functionParams);
    if (context.currentDB) {
      functionStatement.body.body.push(esprima.parseScript(`const useDb = db.db("${context.currentDB}")`).body[0]);
    } else {
      functionStatement.body.body.push(esprima.parseScript('const useDb = db').body[0]);
    }
    if (queryCmd) {
      functionStatement.body.body = functionStatement.body.body.concat(esprima.parseScript(queryCmd).body);
    }

    return functionStatement;
  }

  /**
   * create a promise statement expression and assign it to returnData:
   *  `returnData = new Promise`
   */
  getPromiseStatement(returnData = 'returnData') {
    return esprima.parseScript(`const ${returnData} = new Promise((resolve) => {})`);
  }

  /**
   * create promise statement with the given parameter
   * @param {*} collection  the name of the collection
   * @param {*} funName the name of the function
   * @param {*} extraParam  extra paramter for the function
   * @param {*} queryName query variable command
   */
  createPromiseStatement(collection, funName, extraParam, queryName) {
    const prom = this.getPromiseStatement('returnData');
    // add to promise callback
    const body = prom.body[0].declarations[0].init.arguments[0].body.body;
    let driverStatement = `const arrayData = useDb.collection('${collection}').${funName}(${queryName}`;
    if (extraParam) {
      driverStatement += `,${extraParam})`;
    } else {
      driverStatement += ')';
    }
    body.push(esprima.parseScript(driverStatement));
    body.push(esprima.parseScript('resolve(arrayData)'));
    return prom;
  }

  /**
   * create a call statment for the generated function
   * @param {*} functionName the name of the function
   * @param {*} params funcation paramters
   */
  createCallStatement(functionName, params, variableName = 'r') {
    let results = 'results';
    if (variableName === 'results') {
      results += '1';
    }
    const script = `const ${results}=${functionName}(${params}); \
  ${results}.then((${variableName}) => { \
      console.log(JSON.stringify(${variableName}));\
  }).catch(err => console.error(err));`;
    return esprima.parseScript(script);
  }

  /**
   * create a call statment for the generated function
   * @param {*} functionName the name of the function
   * @param {*} params funcation paramters
   */
  createCallStatementArrayOutput(functionName, params, variableName = 'r') {
    const script = `const results=${functionName}(${params}); \
  results.then((${variableName}) => { \
      ${variableName}.forEach((doc) => {\
            console.log(JSON.stringify(doc));\
        });\
  }).catch(err => console.error(err));`;
    return esprima.parseScript(script);
  }

  /**
   * it will find the db name used in the find command,
   * for example: `db.test.find()` will return "db"
   * @param {*} node  the call expression of the find statement
   */
  findDbName(statement) {
    let root = null;
    if (statement.type === esprima.Syntax.ExpressionStatement) {
      if (statement.expression.type === esprima.Syntax.AssignmentExpression) {
        root = statement.expression.right.callee;
      } else if (statement.expression.type === esprima.Syntax.CallExpression) {
        root = statement.expression.callee;
      }
    } else if (statement.type === esprima.Syntax.VariableDeclaration) {
      root = statement.declarations[0].init.callee;
    }
    do {
      if (root && root.type === esprima.Syntax.MemberExpression) {
        if (root.object.type === esprima.Syntax.Identifier) {
          return root.object.name;
        } else if (root.object.type === esprima.Syntax.CallExpression) {
          root = root.object.callee;
        } else {
          root = root.object;
        }
      } else {
        break;
      }
    } while (root);
    return null;
  }

  /**
   * find the collection name from the statement
   *
   * @param {*} statement
   */
  findCollectionName(statement) {
    let root = null;
    let parent = null;
    if (statement.type === esprima.Syntax.ExpressionStatement) {
      if (statement.expression.type === esprima.Syntax.AssignmentExpression) {
        root = statement.expression.right.callee;
        parent = statement.expression.right;
      } else if (statement.expression.type === esprima.Syntax.CallExpression) {
        root = statement.expression.callee;
        parent = statement.expression;
      }
    } else if (statement.type === esprima.Syntax.VariableDeclaration) {
      root = statement.declarations[0].init.callee;
      parent = statement.declarations[0].init;
    }
    do {
      if (root && root.type === esprima.Syntax.MemberExpression) {
        if (root.object.type === esprima.Syntax.Identifier) {
          if (root.property) {
            return root.property.name;
          }
          break;
        } else if (root.object.type === esprima.Syntax.CallExpression) {
          if (root.object.callee.property.name === 'getSiblingDB') {
            if (root.property.name === 'getCollection' && parent &&
              parent.type === esprima.Syntax.CallExpression &&
              parent.arguments) {
              if (parent.arguments.length > 0) {
                return parent.arguments[0].value;
              }
              return undefined;
            }
            return root.property.name;
          }
          parent = root.object;
          root = root.object.callee;
        } else {
          parent = root;
          root = root.object;
        }
      } else {
        break;
      }
    } while (root);
    return null;
  }

}

module.exports = {
  CommonTranslator,
};
