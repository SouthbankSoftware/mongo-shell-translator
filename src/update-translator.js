const translator = require('./common-translator');

const createCollectionStatement = (node, dbName, colName) => {
  let multi = false;
  const argLen = node.arguments.length;
  if (argLen >= 3) {
    // check multi parameter
    const options = node.arguments[2];
    options.properties.forEach((p, i, object) => {
      if (p.key.name === 'multi') {
        multi = p.value.value;
        object.splice(i, 1);
      }
    });
  } else {
    const args = node.arguments;
    for (let i = 0; i < 2 - argLen; i += 1) {
      args.push({ type: 'ObjectExpression', properties: [] });
    }
    node.arguments = args;
  }
  if (node.callee && node.callee.property) {
    node.callee.property.name = multi ? 'updateMany' : 'updateOne';
  }
  const statement = translator.createCollectionStatement(node, dbName, colName);
  return { ...statement, arguments: node.arguments };
};

module.exports = {
  createCollectionStatement,
};
