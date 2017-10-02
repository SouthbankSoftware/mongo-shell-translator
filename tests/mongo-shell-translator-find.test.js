const assert = require('assert');
const MongoShellTranslator = require('../src/mongo-shell-translator').MongoShellTranslator;
const esprima = require('esprima');
const Context = require('../src/context');
const escodegen = require('escodegen');

describe('test mongo shell translator', () => {
  it('test find parameter with variable value', () => {
    const translator = new MongoShellTranslator();
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

  it('test find with nested or and query', () => {
    const translator = new MongoShellTranslator();
    const code = 'use SampleCollections\n' +
      '\n' +
      'db.Sakila_films.find(\n' +
      '  {  "$and":[\n' +
      '         { "Category":{ $eq:"Family" } } ,\n' +
      '         { "Rating":{ $ne:"R" } } \n' +
      '        ]  });';
    const expected = 'function Sakila_filmsFind(db, category, rating) {\n' +
      '    const useDb = db.db(\'SampleCollections\');\n' +
      '    const query = {\n' +
      '        \'$and\': [\n' +
      '            { \'Category\': { $eq: category } },\n' +
      '            { \'Rating\': { $ne: rating } }\n' +
      '        ]\n' +
      '    };\n' +
      '        const returnData = new Promise(resolve => {\n' +
      '                const arrayData = useDb.collection(\'Sakila_films\').find(query).limit(20).toArray();\n' +
      '                resolve(arrayData);\n' +
      '    });\n' +
      '    return (returnData);\n' +
      '}\n' +
      'const results = Sakila_filmsFind(db, \'Family\', \'R\');\n' +
      'results.then(r => {\n' +
      '    r.forEach(doc => {\n' +
      '        console.log(JSON.stringify(doc));\n' +
      '    });\n' +
      '});';
    const native = translator.translate(code);
    assert.equal(escodegen.generate(esprima.parseScript(native)), escodegen.generate(esprima.parseScript(expected)));
  });
});
