const esprima = require('esprima');

const parseObjectExpressionArgument = (arg) => {
  let queryObject = '{';
  arg.properties.forEach((property, i) => {
    if (property.value.type === esprima.Syntax.Literal) {
      queryObject += `${property.key.raw}: q.${property.key.value}`;
      if (i < arg.properties.length - 1) {
        queryObject += ',';
      }
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      queryObject += `${property.key.raw}: ${parseObjectExpressionArgument(property.value)}`;
    }
  });
  queryObject += '}';
  return queryObject;
};

const parseQueryParameters = (arg) => {
  let queryObject = '';
  if (!arg) {
    return queryObject;
  }
  if (arg.type === esprima.Syntax.ObjectExpression) {
    queryObject = parseObjectExpressionArgument(arg);
  }
  return queryObject;
};

module.exports = { parseQueryParameters };
