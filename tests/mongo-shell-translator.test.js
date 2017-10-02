const assert = require('assert');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const esprima = require('esprima');
const Context = require('../src/context');
const escodegen = require('escodegen');

describe('test mongo shell translator', () => {
  const translator = new MongoShellTranslator();
  it('test find parameter with variable value', () => {
    const nativeCode = translator.translate('const last = \'Lee\';const age = 10;db.getSiblingDB("SampleCollections").explains.find({\'user.name.last\': last, \'user.age\': {$gt: age}});');
    const expected = 'const last = "Lee";\n' +
      'const age = 10;\n' +
      'function explainsFind(db, userNameLast, userAge) {\n' +
      '    const useDb = db.db("SampleCollections");\n' +
      '    const query = {\n' +
      '      "user.name.last": userNameLast,\n' +
      '      "user.age": { $gt: userAge }\n' +
      '    };\n' +
      '    const returnData = new Promise(resolve => {\n' +
      '      const arrayData = useDb\n' +
      '        .collection("explains")\n' +
      '        .find(query)\n' +
      '        .limit(20)\n' +
      '        .toArray();\n' +
      '      resolve(arrayData);\n' +
      '    });\n' +
      '    return returnData;\n' +
      '  }\n' +
      'const results = explainsFind(db, last, age);\n' +
      'results.then(r => {\n' +
      '  r.forEach(doc => {\n' +
      '    console.log(JSON.stringify(doc));\n' +
      '  });\n' +
      '});';
    assert.equal(escodegen.generate(esprima.parseScript(nativeCode)), escodegen.generate(esprima.parseScript(expected)));
  });
});
