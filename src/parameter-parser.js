const esprima = require('esprima');

const parseQueryParameters = (arg) => {
  let queryObject = '';
  if (!arg) {
    return queryObject;
  }
  if (arg.type === esprima.Syntax.ObjectExpression) {
    queryObject += '{';
    arg.properties.forEach((property, i) => {
      if (property.value.type === esprima.Syntax.Literal) {
        queryObject += `${property.key.raw}: q.${property.key.value}`;
        if (i < arg.properties.length - 1) {
          queryObject += ',';
        }
      }
    });
    queryObject += '}';
  }
  return queryObject;
};

module.exports = { parseQueryParameters };
