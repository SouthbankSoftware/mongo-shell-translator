const assert = require('assert');
const parameterParser = require('../src/parameter-parser');
const esprima = require('esprima');
const translator = require('../src/common-translator');

describe('argument parser test suite', () => {
  it('test parser empty query parameter', () => {
    let code = esprima.parseScript('db.test.find()');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '');

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{}');
  });

  it('test parse simple query parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey"})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"name": q.name}');

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{}');
  });
});
