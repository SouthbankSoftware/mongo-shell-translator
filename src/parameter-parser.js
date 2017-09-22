const esprima = require('esprima');
const escodegen = require('escodegen');

const findOperators = ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$and', '$not', '$nor', '$or', '$exists', '$type', '$mod', '$regex', '$text', '$where', '$geoIntersects', '$geoWithin', '$near', '$nearSphere', '$all', '$elemMatch', '$size', '$bitsAllClear', '$bitsAllSet', '$bitsAnyClear', '$bitsAnySet', '$comment', '$meta', '$slice'];

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

const parseObjectExpressionArgument = (arg, many = false, parentKey = '', parameters = []) => {
  let queryObject = '{';
  const properties = arg.properties;
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
    const ignoreKey = ['$and'].indexOf(keyName) >= 0;
    if (keyName === '$eq' || keyName === '$gt' || keyName === '$gte' || keyName === '$in' || keyName === '$exists' ||
      keyName === '$lt' || keyName === '$lte' || keyName === '$ne' || keyName === '$nin') {
      keyValue = parentKey;
    }
    if (property.value.type === esprima.Syntax.Literal) {
      if (many) {
        queryObject += `${keyName}: q.${keyValue}`;
      } else {
        queryObject += `${keyName}: ${keyValue}`;
      }!ignoreKey && parameters.push({ name: keyValue, value: property.value.raw });
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      queryObject += `${keyName}: ${parseObjectExpressionArgument(property.value, many, keyName, parameters)}`;
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
          queryObject += `${keyName}: q.${keyValue}`;
        } else {
          queryObject += `${keyName}: ${keyValue}`;
        }!ignoreKey && parameters.push({ name: keyValue, value: escodegen.generate(property.value) });
      } else {
        !ignoreKey && parameters.push({ name: keyValue, value: escodegen.generate(property.value) });
        queryObject += `${keyName}: [`;
        property.value.elements.forEach((element, j) => {
          queryObject += `${parseObjectExpressionArgument(element, many, keyName, parameters)}`;
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
  const parameters = [];
  if (!arg) {
    return { queryObject, parameters };
  }
  if (arg.type === esprima.Syntax.ObjectExpression) {
    queryObject = parseObjectExpressionArgument(arg, false, '', parameters);
  }
  return { queryObject, parameters };
};

/**
 * parse the arguments to replace value as argument variable
 *
 * @param {*} arg
 */
const parseQueryManyParameters = (arg) => {
  let queryObject = '';
  const parameters = [];
  if (!arg) {
    return { queryObject, parameters };
  }
  if (arg.type === esprima.Syntax.ObjectExpression) {
    queryObject = parseObjectExpressionArgument(arg, true, '', parameters);
  }
  return { queryObject, parameters };
};

module.exports = {
  parseQueryParameters,
  getParameterNumber,
  parseQueryManyParameters,
};
