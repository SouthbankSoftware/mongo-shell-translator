const esprima = require('esprima');

const getParameterNumber = (arg, num = 0) => {
  arg && arg.properties.forEach((property) => {
    if (property.value.type === esprima.Syntax.Literal) {
      num += 1;
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      num = getParameterNumber(property.value, num);
    } else if (property.value.type === esprima.Syntax.ArrayExpression) {
      property.value.elements.forEach((element) => {
        num = getParameterNumber(element, num);
      });
    }
  });
  return num;
};

const parseObjectExpressionArgument = (arg, many = false, parentKey = '') => {
  let queryObject = '{';
  let properties;
  if (arg.type === esprima.Syntax.ArrayExpression) {
    properties = arg.elements;
  } else {
    properties = arg.properties;
  }
  properties.forEach((property, i) => {
    let keyValue = '';
    let keyName = '';
    if (property.key.type === esprima.Syntax.Identifier) {
      keyValue = property.key.name;
      keyName = property.key.name;
    } else if (property.key.type === esprima.Syntax.Literal) {
      keyValue = property.key.value;
      keyName = property.key.raw;
    }
    if (keyName === '$eq' || keyName === '$gt' || keyName === '$gte' || keyName === '$in' ||
      keyName === '$lt' || keyName === '$lte' || keyName === '$ne' || keyName === '$nin') {
      keyValue = parentKey;
    }
    if (property.value.type === esprima.Syntax.Literal) {
      if (many) {
        queryObject += `${keyName}: q.${keyValue}`;
      } else {
        queryObject += `${keyName}: ${keyValue}`;
      }
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      queryObject += `${keyName}: ${parseObjectExpressionArgument(property.value, many, keyName)}`;
    } else if (property.value.type === esprima.Syntax.ArrayExpression) {
      queryObject += `${keyName}: [`;
      property.value.elements.forEach((element, j) => {
        queryObject += `${parseObjectExpressionArgument(element, many, keyName)}`;
        if (j < property.value.elements.length - 1) {
          queryObject += ',';
        }
      });
      queryObject += ']';
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
