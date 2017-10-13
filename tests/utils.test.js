const assert = require('assert');
const esprima = require('esprima');
const findSupportedStatement = require('../src/utils').findSupportedStatement;
const escodegen = require('escodegen');

describe('utils test set', () => {
  it('test find supported statement', () => {
    let ast = esprima.parseScript('db.test.find()');
    let supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 0);

    ast = esprima.parseScript('db.test.find({}, {}).sort({})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 1);

    ast = esprima.parseScript('db.test.find({}, {}).sort({}).skip(10).limit(100)');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 3);
    assert.equal(supported.params[0].arguments[0].value, '100');
    assert.equal(supported.params[1].arguments[0].value, '10');

    ast = esprima.parseScript('var i = db.test.find({}, {})');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);

    ast = esprima.parseScript('var i = db.test.find({}, {}).sort({}).skip(10).limit(100)');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.variable, 'i');

    ast = esprima.parseScript('i = db.test.find({}, {}).sort({}).skip(10).limit(100).sort()');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'find');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 4);
    assert.equal(supported.variable, 'i');

    ast = esprima.parseScript('print("hello")');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, 'print');
    assert.equal(supported.expression.type, esprima.Syntax.CallExpression);
    assert.equal(supported.params.length, 1);
    assert.equal(supported.params[0].value, 'hello');

    ast = esprima.parseScript('var i');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, undefined);

    ast = esprima.parseScript('var i=0');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, undefined);

    ast = esprima.parseScript('i=0');
    supported = findSupportedStatement(ast.body[0]);
    assert.equal(supported.name, undefined);
  });
});
