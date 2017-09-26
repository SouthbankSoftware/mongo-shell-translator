const esprima = require('esprima');
const escodegen = require('escodegen');

const findOperators = ['$eq', '$gt', '$gte', '$in', '$lt', '$lte', '$ne', '$nin', '$and', '$not', '$nor', '$or', '$exists', '$type', '$mod', '$regex', '$text', '$where', '$geoIntersects', '$geoWithin', '$near', '$nearSphere', '$all', '$elemMatch', '$size', '$bitsAllClear', '$bitsAllSet', '$bitsAnyClear', '$bitsAnySet', '$comment', '$meta', '$slice'];

const capitalize = str => str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
const capitalizeFirst = str => str.charAt(0).toUpperCase() + str.slice(1);

const camelCase = (str) => {
  const string = str.toLowerCase().replace(/[^A-Za-z0-9]/g, ' ').split(' ')
    .reduce((result, word) => result + capitalize(word.toLowerCase()));
  return string.charAt(0).toLowerCase() + string.slice(1);
};

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

const parseObjectExpressionArgument = (arg, many = false, parentKey = '', parameters = [], paramSuffix = '') => {
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
    const jsonObjName = paramSuffix ? 'u.' : 'q.';
    const ignoreKey = ['$and'].indexOf(keyName) >= 0;
    if (keyName === '$eq' || keyName === '$gt' || keyName === '$gte' || keyName === '$in' || keyName === '$exists' ||
      keyName === '$lt' || keyName === '$lte' || keyName === '$ne' || keyName === '$nin') {
      keyValue = parentKey;
    }
    const camelKeyValue = camelCase(keyValue);
    if (property.value.type === esprima.Syntax.Literal) {
      if (many) {
        const camel = camelCase(`${keyValue}`);
        queryObject += `${keyName}: ${jsonObjName}${camel}${paramSuffix}`;
      } else {
        const camel = camelCase(keyValue);
        queryObject += `${keyName}: ${camel}${paramSuffix}`;
      }!ignoreKey && parameters.push({ name: camelKeyValue, value: property.value.raw });
    } else if (property.value.type === esprima.Syntax.ObjectExpression) {
      queryObject += `${keyName}: ${parseObjectExpressionArgument(property.value, many, keyValue, parameters, paramSuffix)}`;
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
          const camel = camelCase(`${keyValue}`);
          queryObject += `${keyName}: ${jsonObjName}${camel}${paramSuffix}`;
        } else {
          const camel = camelCase(keyValue);
          queryObject += `${keyName}: ${camel}${paramSuffix}`;
        }!ignoreKey && parameters.push({ name: camelKeyValue, value: escodegen.generate(property.value) });
      } else {
        !ignoreKey && parameters.push({ name: camelKeyValue, value: escodegen.generate(property.value) });
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

const parseQueryParameters = (arg, paramSuffix = '') => {
  let queryObject = '';
  const parameters = [];
  if (!arg) {
    return { queryObject, parameters };
  }
  if (arg.type === esprima.Syntax.ObjectExpression) {
    queryObject = parseObjectExpressionArgument(arg, false, '', parameters, paramSuffix);
  }
  return { queryObject, parameters };
};

/**
 * parse the arguments to replace value as argument variable
 *
 * @param {*} arg
 */
const parseQueryManyParameters = (arg, paramSuffix) => {
  let queryObject = '';
  const parameters = [];
  if (!arg) {
    return { queryObject, parameters };
  }
  if (arg.type === esprima.Syntax.ObjectExpression) {
    queryObject = parseObjectExpressionArgument(arg, true, '', parameters, paramSuffix);
  }
  return { queryObject, parameters };
};

module.exports = {
  parseQueryParameters,
  getParameterNumber,
  parseQueryManyParameters,
  capitalizeFirst,
};
