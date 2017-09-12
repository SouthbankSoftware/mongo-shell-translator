const MongoShellTranslator = require('./mongo-shell-translator').MongoShellTranslator;
const options = require('./options');

module.exports = { MongoShellTranslator, SyntaxType: { ...options.syntaxType } };
