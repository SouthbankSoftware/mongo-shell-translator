import options from './options';

const esprima = require('esprima');
const escodegen = require('escodegen');

/**
 * create find statement in native driver. It generates the code
 * ` db.collection(COL_NAME).find(...) `
 * @param {*} dbName  the db command name
 * @param {*} colName  the collection name used on the find command
 */
const createFindStatement = (dbName, colName) => {
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
  return object;
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

const getCallbackStatement = (syntax) => {
  switch (syntax) {
    case options.syntaxType.await:
      return {};
    default:
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
  }
};

/**
 * add toArray statement at the end of find statement.
 * @param node
 */
const getToArrayStatement = (node, syntax) => {
  const statement = escodegen.generate(node);
  console.log('xxxx', statement);
  if (!statement.trim().endsWith('toArray();') && !statement.trim().endsWith('toArray()')) {
    console.log('add toarray');
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
      arguments: [getCallbackStatement(syntax)],
    };
  }
};

const addCallbackOnStatement = (node, syntax) => {
  const statement = getToArrayStatement(node, syntax);
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
  } else if (node.type === esprima.Syntax.VariableDeclarator) {
    node.init.arguments = [getCallbackStatement(options.syntaxType.callback, syntax)];
  } else if (node.type === esprima.Syntax.AssignmentExpression) {
    node.right.arguments = [getCallbackStatement(options.syntaxType.callback, syntax)];
  } else {
    node.expression.arguments = [getCallbackStatement(options.syntaxType.callback, syntax)];
  }
};

export default {
  createFindStatement,
  findDbName,
  getToArrayStatement,
  getCallbackStatement,
  addCallbackOnStatement,
};
