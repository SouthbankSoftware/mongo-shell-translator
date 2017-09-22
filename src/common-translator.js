const esprima = require('esprima');
const escodegen = require('escodegen');
const syntaxType = require('./options').syntaxType;
const commandName = require('./options').commandName;

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
 * wrap the statement on the given node. it will attach the given node
 * inside the the statement and return the statement node
 * @param {*} node
 * @param {*} statement
 */
const wrapStatementOnNode = (node, statement) => {
  if (statement) {
    if (node.type === esprima.Syntax.VariableDeclarator) {
      statement.callee.object = node.init;
      node.init = statement;
    } else if (node.type === esprima.Syntax.AssignmentExpression) {
      statement.callee.object = node.right;
      node.right = statement;
    } else {
      statement.callee.object = node.expression;
      node.expression = statement;
    }
  }
};

/**
 * get then statement when using promise syntax
 */
const getThenPromise = () => {
  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: null,
      property: {
        type: 'Identifier',
        name: 'then',
      },
    },
    arguments: [],
  };
};

/**
 * get await statement
 */
const getAwaitStatement = () => {
  return {
    type: 'AwaitExpression',
  };
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
        if (root.property) {
          return root.property.name;
        }
        break;
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

/**
 * get callback function arguments, it is used for promise and callback cases.
 * @param error: whether include error argument
 */
const getCallbackArguments = (error = false, argName = 'docs') => {
  const params = error ? [{
    type: esprima.Syntax.Identifier,
    name: 'err',
  }, {
    type: esprima.Syntax.Identifier,
    name: argName,
  }] : [{
    type: esprima.Syntax.Identifier,
    name: argName,
  }];

  return {
    type: esprima.Syntax.FunctionExpression,
    id: null,
    body: {
      type: esprima.Syntax.BlockStatement,
      body: [],
    },
    params,
    generator: false,
    expression: false,
    async: false,
  };
};

/**
 * add the callback arguments on node statement
 * @param {*} node
 * @param {*} error   whether the callback function has error argument
 * @param {*} append   whether append callback function argument instead of replace
 * @param {*} argName   the argument name
 */
const addNodeArguments = (node, error, append, argName = 'docs') => {
  const argument = getCallbackArguments(error, argName);
  if (node.type === esprima.Syntax.VariableDeclarator) {
    append === true ? node.init.arguments.push(argument) : node.init.arguments = [argument];
  } else if (node.type === esprima.Syntax.AssignmentExpression) {
    append === true ? node.right.arguments.push(argument) : node.right.arguments = [argument];
  } else {
    append === true ? node.expression.arguments.push(argument) :
      node.expression.arguments = [argument];
  }
};

/**
 * add toArray statement at the end of find statement.
 * @param node
 */
const getToArrayStatement = (node, syntax) => {
  const statement = escodegen.generate(node);
  if (!statement.trim().endsWith('toArray();') && !statement.trim().endsWith('toArray()')) {
    return {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: null,
        property: {
          type: 'Identifier',
          name: 'toArray',
        },
      },
      arguments: syntax === syntaxType.callback ? [getCallbackArguments(true)] : [],
    };
  }
  return null;
};


/**
 * add callback on the statement. It can be callback, promise or await/sync
 * @param {*} node
 * @param {*} syntax
 * @param {*} toArray   whether append toArray at the end of the statement
 * @param {*} error   whether the callback function has error argument
 * @param {*} append   whether append callback function argument instead of replace
 * @param {*} argName   the argument name
 */
const addCallbackOnStatement = (node, syntax, toArray = true, error = true, append = false, argName = 'docs') => {
  let statement;
  switch (syntax) {
    case syntaxType.await:
      if (toArray) {
        statement = getToArrayStatement(node, syntax);
        wrapStatementOnNode(node, statement);
      }
      statement = getAwaitStatement();
      if (node.type === esprima.Syntax.VariableDeclarator) {
        statement.argument = node.init;
        node.init = statement;
      } else if (node.type === esprima.Syntax.AssignmentExpression) {
        statement.argument = node.right;
        node.right = statement;
      } else {
        statement.argument = node.expression;
        node.expression = statement;
      }
      break;
    case syntaxType.promise:
      if (toArray) {
        statement = getToArrayStatement(node, syntax);
        wrapStatementOnNode(node, statement);
      }
      statement = getThenPromise(node, syntax);
      wrapStatementOnNode(node, statement);
      addNodeArguments(node, false, append, argName);
      break;
    default:
      if (toArray) {
        statement = getToArrayStatement(node, syntax);
        wrapStatementOnNode(node, statement);
      }
      addNodeArguments(node, error, append, argName);

  }
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
  do {
    if (root && root.type === esprima.Syntax.MemberExpression &&
      root.property.type === esprima.Syntax.Identifier) {
      const name = root.property.name;
      if (Object.values(commandName).indexOf(name) > -1) {
        return { name, expression, params };
      }
      if (root.object && root.object.type === esprima.Syntax.CallExpression) {
        params.push(expression);
        expression = root.object;
        root = root.object.callee;
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

module.exports = {
  getAwaitStatement,
  findDbName,
  createCollectionStatement,
  wrapStatementOnNode,
  getThenPromise,
  getCallbackArguments,
  addCallbackOnStatement,
  addNodeArguments,
  findCollectionName,
  findSupportedStatement,
  getPromiseStatement,
};
