const esprima = require('esprima');

const getParameterNumber = (arg, num = 0) => {
  arg && arg.properties && arg.properties.forEach((property) => {
    if (property.value.type === esprima.Syntax.Literal) {
      num += 1;
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      num = getParameterNumber(property.value, num);
    } else if (property.value.type === esprima.Syntax.ArrayExpression) {
      for (let i = 0; i < property.value.elements.length; i += 1) {
        const element = property.value.elements[i];
        if (element.type !== esprima.Syntax.Literal) {
          num = getParameterNumber(element, num);
        } else {
          num += 1;
          break;
        }
      }
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
      let simpleArrayElement = false;
      for (let j = 0; j < property.value.elements.length; j += 1) {
        if (property.value.elements[j].type === esprima.Syntax.Literal) {
          simpleArrayElement = true;
          break;
        }
      }
      if (simpleArrayElement) {
        if (many) {
          queryObject += `${keyName}: : q.${keyValue}`;
        } else {
          queryObject += `${keyName}: ${keyValue}`;
        }
      } else {
        queryObject += `${keyName}: [`;

        property.value.elements.forEach((element, j) => {
          queryObject += `${parseObjectExpressionArgument(element, many, keyName)}`;
          if (j < property.value.elements.length - 1) {
            queryObject += ',';
          }
        });
        queryObject += ']';
      }
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
