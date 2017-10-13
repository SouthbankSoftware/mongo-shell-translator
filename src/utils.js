const commandName = require('./options').commandName;
const os = require('os');
const esprima = require('esprima');
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
  let variable;
  if (statement.type === esprima.Syntax.ExpressionStatement) {
    if (statement.expression.type === esprima.Syntax.AssignmentExpression) {
      variable = statement.expression.left.name;
      root = statement.expression.right.callee;
      expression = statement.expression.right;
    } else if (statement.expression.type === esprima.Syntax.CallExpression) {
      root = statement.expression.callee;
      expression = statement.expression;
    }
  } else if (statement.type === esprima.Syntax.VariableDeclaration && statement.declarations[0].init) {
    variable = statement.declarations[0].id.name;
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
        return { name, expression, params, dbName, variable };
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
    } else if (root && root.type === esprima.Syntax.Identifier) {
      return { name: root.name, params: expression.arguments, expression, variable };
    } else {
      break;
    }
  } while (root);
  return {};
};

const getSeparator = () => {
  if (process.browser) {
    return window.navigator.platform.toLowerCase() === 'win32' ? '\r\n' : '\n';
  }
  return os.platform() === 'win32' ? '\r\n' : '\n';
};
module.exports = {
  findSupportedStatement,
  getSeparator,
};
