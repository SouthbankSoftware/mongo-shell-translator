/**
 * @param requiredArguNum  the number of required arguments are required
 * @param maxArguNum the max number of auguments
 */
const createArguments = (node, requiredArguNum, maxArguNum) => {
  const argLen = node.arguments.length;
  const args = node.arguments;
  console.log('arg len ', argLen, requiredArguNum, maxArguNum);
  if (argLen < requiredArguNum) {
    for (let i = 0; i < requiredArguNum - argLen; i += 1) {
      args.push({ type: 'ObjectExpression', properties: [] });
    }
  } else if (maxArguNum > 0 && argLen > maxArguNum) {
    args.splice(maxArguNum, argLen - requiredArguNum);
  }
  return args;
};

module.exports = {
  createArguments,
};
