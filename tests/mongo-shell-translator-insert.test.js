const assert = require('assert');
const esprima = require('esprima');
const escodegen = require('escodegen');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;

describe('test insert translator', () => {
  it('test insert single document', () => {
    const translator = new MongoShellTranslator();
    const nativeCode = translator.translate('use test\n db.people.insert({a:1})');
    const expected = 'function peopleInsertOne(db, a) {\n' +
      '  const useDb = db.db("test");\n' +
      '  const doc = { a: a };\n' +
      '  const returnData = new Promise(resolve => {\n' +
      '    const arrayData = useDb.collection("people").insertOne(doc);\n' +
      '    resolve(arrayData);\n' +
      '  });\n' +
      '  return returnData;\n' +
      '}\n' +
      'const results = peopleInsertOne(db, 1);\n' +
      'results\n' +
      '  .then(r => {\n' +
      '    console.log(JSON.stringify(r));\n' +
      '  })\n' +
      '  .catch(err => console.error(err));\n';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
