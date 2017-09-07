import { syntaxType } from './options';

const esprima = require('esprima');
const escodegen = require('escodegen');

/**
 * create find statement in native driver. It generates the code
 * ` db.collection(COL_NAME).find(...) `
 * @param {*} dbName  the db command name
 * @param {*} colName  the collection name used on the find command
 */
const createFindStatement = (node, dbName, colName) => {
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
  let args = [];
  if (node.arguments.length > 0) {
    args = [node.arguments[0]];
  }
  return { object, arguments: args };
};

/**
 * it will find the db name used in the find command,
 * for example: `db.test.find()` will return "db"
 * @param {*} node  the call expression of the find statement
 */
const findDbName = (node) => {
  let root = node.callee;
  do {
    if (root && root.type === esprima.Syntax.MemberExpression && root.object) {
      root = root.object;
    } else if (!root.object && root.type === esprima.Syntax.Identifier) {
      return root.name;
    } else {
      break;
    }
  } while (root);
  return null;
};

/**
 * get callback function arguments, it is used for promise and callback cases.
 */
const getCallbackArguments = () => {
  return {
    type: esprima.Syntax.FunctionExpression,
    id: null,
    body: {
      type: esprima.Syntax.BlockStatement,
      body: [],
    },
    params: [{
      type: esprima.Syntax.Identifier,
      name: 'err',
    }, {
      type: esprima.Syntax.Identifier,
      name: 'docs',
    }],
    generator: false,
    expression: false,
    async: false,
  };
};

/**
 * add the callback arguments on node statement
 * @param {*} node
 */
const addNodeArguments = (node) => {
  if (node.type === esprima.Syntax.VariableDeclarator) {
    node.init.arguments = [getCallbackArguments()];
  } else if (node.type === esprima.Syntax.AssignmentExpression) {
    node.right.arguments = [getCallbackArguments()];
  } else {
    node.expression.arguments = [getCallbackArguments()];
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
      arguments: syntax === syntaxType.callback ? [getCallbackArguments()] : [],
    };
  }
  return null;
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
 * add callback on the statement. It can be callback, promise or await/sync
 * @param {*} node
 * @param {*} syntax
 */
const addCallbackOnStatement = (node, syntax) => {
  let statement;
  switch (syntax) {
    case syntaxType.await:
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
      statement = getToArrayStatement(node, syntax);
      wrapStatementOnNode(node, statement);
      statement = getThenPromise(node, syntax);
      wrapStatementOnNode(node, statement);
      addNodeArguments(node);
      break;
    default:
      statement = getToArrayStatement(node, syntax);
      wrapStatementOnNode(node, statement);
      addNodeArguments(node);
  }
};

export default {
  createFindStatement,
  findDbName,
  getToArrayStatement,
  getCallbackArguments,
  addCallbackOnStatement,
};
