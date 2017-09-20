const assert = require('assert');
const parameterParser = require('../src/parameter-parser');
const esprima = require('esprima');
const translator = require('../src/common-translator');

describe('argument parser test suite', () => {
  it('test get argument number', () => {
    let code = esprima.parseScript('db.test.find()');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 0);

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 0);

    code = esprima.parseScript('db.test.find({"name": "Joey"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 1);

    code = esprima.parseScript('db.test.find({"name": "Joey", "full-name": {"last": "zhao", "first": "yi"}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 3);

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 4);

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}, "key4": "v4", "key5":"v5"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 6);

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 0);

    code = esprima.parseScript('db.test.find({$and: [{"first": "f"}, {"last": "l"}, {"middle": "m"}]})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 3);

    code = esprima.parseScript('db.test.find({ qty: { $in: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    num = parameterParser.getParameterNumber(expression.arguments[0]);
    assert.equal(num, 1);
  });

  it('test parser empty query parameter', () => {
    let code = esprima.parseScript('db.test.find()');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '');

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{}');

    code = esprima.parseScript('db.test.find()');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '');

    code = esprima.parseScript('db.test.find({})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{}');
  });

  it('test parse simple query parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey"})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"name": name}');

    code = esprima.parseScript('db.test.find({"first": "Joey", "last": "Zhao"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"first": first,"last": last}');
  });

  it('test parse nested json query parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey", "full-name": {"last": "zhao", "first": "yi"}})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"name": name,"full-name": {"last": last,"first": first}}');

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{"age": age,"nested1": {"key1": key1,"nested2": {"key2": key2,"nested3": {"key3": key3}}}}');
  });

  it('test parse query more than 4 parameters', () => {
    let code = esprima.parseScript('db.test.find({"name": "Joey", "full-name": {"last": "zhao", "first": "yi"}, "education": {"junior":"s1", "senior":"s2"}})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{"name": q.name,"full-name": {"last": q.last,"first": q.first},"education": {"junior": q.junior,"senior": q.senior}}');

    code = esprima.parseScript('db.test.find({"age": 100, "nested1": {"key1": 1, "nested2": {"key2": 2, "nested3": {"key3": "key3"}}}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{"age": q.age,"nested1": {"key1": q.key1,"nested2": {"key2": q.key2,"nested3": {"key3": q.key3}}}}');
  });

  it('test parser array parameter', () => {
    let code = esprima.parseScript('db.test.find({$and: [{"first": true}, {"last": true}]})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{$and: [{"first": first},{"last": last}]}');

    code = esprima.parseScript('db.test.find({"name": "aaa", $and: [{"first": true}, {"last": true}], "name": "aaa"})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{"name": q.name,$and: [{"first": q.first},{"last": q.last}],"name": q.name}');
  });

  it('test add operator on query', () => {
    let code = esprima.parseScript('db.test.find({$exits: {"name": true}})');
    let { expression } = translator.findSupportedStatement(code.body[0]);
    let qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{$exits: {"name": name}}');

    code = esprima.parseScript('db.test.find({age: {$gt: 20}})');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{age: {$gt: age}}');

    code = esprima.parseScript('db.test.find({ qty: { $eq: 20 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$eq: qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $gte: 20 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$gte: q.qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $lt: 5 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$lt: q.qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $lte: 5 } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$lte: q.qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $ne: "ne" } } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$ne: qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $ne: "ne" }, qty: {$lt: 100}, qty: {$ne: 30} } )');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$ne: qty},qty: {$lt: qty},qty: {$ne: qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $in: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$in: qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $nin: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$nin: qty}}');

    code = esprima.parseScript('db.test.find({ qty: { $nin: [ 5, 15 ] } })');
    expression = translator.findSupportedStatement(code.body[0]).expression;
    qCode = parameterParser.parseQueryManyParameters(expression.arguments[0]);
    assert.equal(qCode, '{qty: {$nin: q.qty}}');
  });

  it('test parse json paramter', () => {
    let code = esprima.parseScript('db.test.find({"name": true})');
    let json = parameterParser.getJsonObjectFromObjectException(code.body[0].expression.arguments[0]);
    assert.equal(json.name, true);

    code = esprima.parseScript('db.test.find({name: true})');
    json = parameterParser.getJsonObjectFromObjectException(code.body[0].expression.arguments[0]);
    assert.equal(json.name, true);
  });
});
