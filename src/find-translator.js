const esprima = require('esprima');

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

module.exports = createFindStatement;
