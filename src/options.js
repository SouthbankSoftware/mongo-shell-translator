export default {
  parseOptions: {
    tolerant: true,
    raw: true,
    tokens: true,
    range: true,
    comment: true,
  },
  syntaxType: {
    callback: 'callback',
    promise: 'promise',
    await: 'await',
  },
};
