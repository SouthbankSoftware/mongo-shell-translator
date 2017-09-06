const esprima = require('esprima');

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
  object.callee = {};
  object.callee.type = esprima.Syntax.MemberExpression;
  object.callee.property = {};
  object.callee.property.name = 'collection';
  object.callee.property.type = esprima.Syntax.Identifier;
  object.callee.object = {};
  object.callee.object.name = dbName;
  object.callee.object.type = esprima.Syntax.Identifier;
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
};

module.exports = { createFindStatement, findDbName };
