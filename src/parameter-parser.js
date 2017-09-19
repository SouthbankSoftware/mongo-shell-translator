const esprima = require('esprima');

const getParameterNumber = (arg, num = 0) => {
  arg && arg.properties.forEach((property) => {
    if (property.value.type === esprima.Syntax.Literal) {
      num += 1;
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      num = getParameterNumber(property.value, num);
    }
  });
  return num;
};

const parseObjectExpressionArgument = (arg, many = false) => {
  let queryObject = '{';
  arg.properties.forEach((property, i) => {
    if (property.value.type === esprima.Syntax.Literal) {
      if (many) {
        queryObject += `${property.key.raw}: q.${property.key.value}`;
      } else {
        queryObject += `${property.key.raw}: ${property.key.value}`;
      }
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      queryObject += `${property.key.raw}: ${parseObjectExpressionArgument(property.value, many)}`;
    }
    if (i < arg.properties.length - 1) {
      queryObject += ',';
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

const parseQueryManyParameters = (arg) => {
  let queryObject = '';
  if (!arg) {
    return queryObject;
  }
  if (arg.type === esprima.Syntax.ObjectExpression) {
    queryObject = parseObjectExpressionArgument(arg, true);
  }
  return queryObject;
};

module.exports = { parseQueryParameters, getParameterNumber, parseQueryManyParameters };
