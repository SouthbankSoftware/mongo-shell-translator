const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');

const assertStatementEqual = (code, expected) => {
  const parsed = esprima.parse(expected);
  assert.equal(escodegen.generate(parsed), code);
};

module.exports = {
  assertStatementEqual,
};
