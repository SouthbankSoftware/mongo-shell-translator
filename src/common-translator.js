const esprima = require('esprima');
const escodegen = require('escodegen');
const commandName = require('./options').commandName;
const os = require('os');
const parameterParser = require('./parameter-parser');
const template = require('./template-ast');
const syntaxType = require('./options').syntaxType;

/**
 * create collection statement in native driver. It generates the code
 * ` db.collection(COL_NAME)... `
 * @param {*} dbName  the db command name
 * @param {*} colName  the collection name used on the find command
 */
const createCollectionStatement = (node, dbName, colName) => {
  const object = {};
  object.type = esprima.Syntax.CallExpression;
  object.arguments = [{ type: 'Literal', value: colName }];
  object.callee = {
    type: esprima.Syntax.MemberExpression,
    property: {
      name: 'collection',
      type: esprima.Syntax.Identifier,
    },
    object: {
      name: dbName,
      type: esprima.Syntax.Identifier,
    },
  };
  return { object, arguments: node.arguments };
};

/**
 * it will find the db name used in the find command,
 * for example: `db.test.find()` will return "db"
 * @param {*} node  the call expression of the find statement
 */
const findDbName = (statement) => {
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
};

const findCollectionName = (statement) => {
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
};

/**
 * find all supported mongodb statements for example: find, insert, update, delete, aggregate
 *
 * @param {*} statement
 * @return {name, expression, params} name is the function name such as find, insert, etc.
 *                                    expression is the full statement expression such as: db.test.find({...})
 *                                    params is the parameters after the expression, for the input db.test.find().limit(10).skip(100), it will return an array of ast including `limit(10)`, `skip(100)`
 */
const findSupportedStatement = (statement) => {
  let root = null; // the callee expression
  let expression = null;
  if (statement.type === esprima.Syntax.ExpressionStatement) {
    if (statement.expression.type === esprima.Syntax.AssignmentExpression) {
      root = statement.expression.right.callee;
      expression = statement.expression.right;
    } else if (statement.expression.type === esprima.Syntax.CallExpression) {
      root = statement.expression.callee;
      expression = statement.expression;
    }
  } else if (statement.type === esprima.Syntax.VariableDeclaration) {
    root = statement.declarations[0].init.callee;
    expression = statement.declarations[0].init;
  }
  const params = [];
  let dbName;
  do {
    if (root && root.type === esprima.Syntax.MemberExpression &&
      root.object.type === esprima.Syntax.MemberExpression &&
      root.object.object.type === esprima.Syntax.CallExpression &&
      root.object.object.callee.property.name === 'getSiblingDB' &&
      root.object.object.arguments.length > 0) {
      dbName = root.object.object.arguments[0].value;
    } else if (root && root.type === esprima.Syntax.MemberExpression &&
      root.object && root.object.type === esprima.Syntax.CallExpression &&
      root.object.callee && root.object.callee.type === esprima.Syntax.MemberExpression &&
      root.object.callee.property.name === 'getCollection' &&
      root.object.callee.object && root.object.callee.object.arguments.length > 0) {
      dbName = root.object.callee.object.arguments[0].value;
    }
    if (root && root.type === esprima.Syntax.MemberExpression &&
      root.property.type === esprima.Syntax.Identifier) {
      const name = root.property.name;
      if (Object.values(commandName).indexOf(name) > -1) {
        return { name, expression, params, dbName };
      }
      if (root.object && root.object.type === esprima.Syntax.CallExpression) {
        params.push(expression);
        if (root.object.callee.property.name === 'getSiblingDB') {
          if (root.object.arguments.length > 0) {
            dbName = root.object.arguments[0].value;
          }
        }
        expression = root.object;
        root = root.object.callee;
      } else {
        break;
      }
    } else {
      break;
    }
  } while (root);
  return {};
};

/**
 * create a promise statement expression and assign it to returnData:
 *  `returnData = new Promise`
 */
const getPromiseStatement = (returnData = 'returnData') => {
  return esprima.parseScript(`const ${returnData} = new Promise((resolve) => {})`);
};

const getSeparator = () => {
  if (process.browser) {
    return window.navigator.platform.toLowerCase() === 'win32' ? '\r\n' : '\n';
  }
  return os.platform() === 'win32' ? '\r\n' : '\n';
};

const createCallStatement = (functionName, params) => {
  const script = `const results=${functionName}(${params}); \
  results.then((r) => { \
      console.log(JSON.stringify(r));\
  }).catch(err => console.error(err));`;
  return esprima.parseScript(script);
};

const createPromiseStatement = (collection, funName, extraParam, queryName) => {
  const prom = getPromiseStatement('returnData');
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
};

const createFuncationStatement = ({ context, functionName, functionParams, queryCmd }) => {
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
};

const addPromiseToFunction = ({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam, queryName = 'query' }) => {
  const prom = createPromiseStatement(collection, originFunName, extraParam, queryName);
  functionStatement.body.body.push(prom);

  functionStatement.body.body.push({ type: esprima.Syntax.ReturnStatement, argument: { type: esprima.Syntax.Identifier, name: '(returnData)' } });
  if (callFunctionParams) {
    callFunctionParams = `${db}, ${callFunctionParams}`;
  } else {
    callFunctionParams = `${db}`;
  }
};

const createParameters = (statement, updateExpression, originFunName, context) => {
  const db = findDbName(statement);
  const collection = findCollectionName(statement);
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
};

/**
 * create parameterized function
 *
 * @param {*} statement
 * @param {*} updateExpression the update expression inside the statement
 */
const createParameterizedFunction = (statement, updateExpression, params, context, originFunName) => {
  let { db, functionName, queryCmd, callFunctionParams, collection, extraParam, functionParams } = createParameters(statement, updateExpression, originFunName, context);
  const functionStatement = createFuncationStatement({ context, collection, functionName, originFunName, functionParams, extraParam, queryCmd, callFunctionParams, db });
  addPromiseToFunction({ db, functionStatement, callFunctionParams, collection, originFunName, extraParam, queryName: 'query' });
  const callStatement = createCallStatement(functionName, callFunctionParams);
  return { functionStatement, functionName, callStatement };
};

class CommonTranslator {

  constructor(syntax = syntaxType.promise) {
    this.syntax = syntax;
  }

  createParameterizedFunction(statement, updateExpression, params, context, originFunName) {
    return createParameterizedFunction(statement, updateExpression, params, context, originFunName);
  }

  createParameters(statement, updateExpression, originFunName, context) {
    return createParameters(statement, updateExpression, originFunName, context);
  }

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

  createFuncationStatement({ context, functionName, functionParams, queryCmd }) {
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

  getPromiseStatement(returnData = 'returnData') {
    return esprima.parseScript(`const ${returnData} = new Promise((resolve) => {})`);
  }

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

  createCallStatement(functionName, params) {
    return createCallStatement(functionName, params);
  }

  createCallStatementArrayOutput(functionName, params) {
    const script = `const results=${functionName}(${params}); \
  results.then((r) => { \
      r.forEach((doc) => {\
            console.log(JSON.stringify(doc));\
        });\
  }).catch(err => console.error(err));`;
    return esprima.parseScript(script);
  }
}

module.exports = {
  findDbName,
  createCollectionStatement,
  findCollectionName,
  findSupportedStatement,
  getPromiseStatement,
  getSeparator,
  createParameterizedFunction,
  createParameters,
  createPromiseStatement,
  createFuncationStatement,
  createCallStatement,
  addPromiseToFunction,
  CommonTranslator,
};
