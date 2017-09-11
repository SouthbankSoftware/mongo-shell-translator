const escodegen = require('escodegen');

const options = {
  format: {
    indent: {
      style: '    ',
      base: 0,
      adjustMultilineComment: false,
    },
    newline: '\n',
    space: ' ',
    json: false,
    renumber: false,
    hexadecimal: false,
    preserveBlankLines: true,
    quotes: 'single',
    escapeless: false,
    compact: false,
    parentheses: true,
    semicolons: true,
    safeConcatenation: false,
  },
  moz: {
    starlessGenerator: false,
    parenthesizedComprehensionBlock: false,
    comprehensionExpressionStartsWithAssignment: false,
  },
  parse: null,
  comment: true,
  sourceMap: undefined,
  sourceMapRoot: null,
  sourceMapWithCode: false,
  file: undefined,
  sourceContent: 'originalSource',
  directive: false,
  verbatim: undefined,
};

const generate = (ats) => {
  // ats = escodegen.attachComments(ats, ats.comments, ats.tokens);
  return escodegen.generate(ats, Object.assign({}, options));
};

module.exports = generate;
