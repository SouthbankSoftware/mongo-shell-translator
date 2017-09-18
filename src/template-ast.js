const esprima = require('esprima');

const buildFunctionTemplate = (name, params) => {
  return {
    type: esprima.Syntax.FunctionDeclaration,
    id: {
      type: esprima.Syntax.Identifier,
      name,
    },
    params,
    body: {
      type: esprima.Syntax.BlockStatement,
      body: [],
    },
    generator: false,
    expression: false,
    async: false,
  };
};

module.exports = {
  buildFunctionTemplate,
};
