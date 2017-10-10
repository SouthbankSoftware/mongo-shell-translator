const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test drop translator', () => {
  it('test drop collection', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('db.test.drop()');
    const expected = 'function testDrop(db) {\n' +
      '    const useDb = db;\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const ret = useDb.dropCollection(\'test\');\n' +
      '                resolve(ret);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'const results = testDrop(db);\n' +
      'results.then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => console.error(err));';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });

  it('test drop promise chain', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('db.test1.drop()\n db.test2.drop()');
    const expected = 'function test1Drop(db) {\n' +
      '    const useDb = db;\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const ret = useDb.dropCollection(\'test1\');\n' +
      '                resolve(ret);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'function test2Drop(db) {\n' +
      '    const useDb = db;\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const ret = useDb.dropCollection(\'test2\');\n' +
      '                resolve(ret);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'new Promise(resolve => {\n' +
      '    const results = test1Drop(db);\n' +
      '    resolve(results);\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '    const results = test2Drop(db);\n' +
      '    return results;\n' +
      '}).then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '}).catch(err => {\n' +
      '    console.error(err);\n' +
      '});';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
