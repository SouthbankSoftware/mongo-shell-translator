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

    code = esprima.parseScript('db.test.find({"first": "Joey", "last": "Zhao"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"first": q.first,"last": q.last}');
  });

  it('test parse nested json query parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey", "full-name": {"last": "zhao", "first": "yi"}})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"name": q.name,"full-name": {"last": q.last,"first": q.first}}');

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"age": q.age,"nested1": {"key1": q.key1,"nested2": {"key2": q.key2,"nested3": {"key3": q.key3}}}}');
  });
});
