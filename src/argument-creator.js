/**
 * @param argNum  the numbre of arguments are required
 * @param removeExtra if true it will remove arguments after {argNum}
 */
const createArguments = (node, argNum, removeExtra) => {
  const argLen = node.arguments.length;
  const args = node.arguments;
  if (argLen < argNum) {
    for (let i = 0; i < argNum - argLen; i += 1) {
      args.push({ type: 'ObjectExpression', properties: [] });
    }
  } else if (removeExtra && argLen > argNum) {
    args.splice(argNum, argLen - argNum);
  }
  return args;
};

module.exports = {
  createArguments,
};
