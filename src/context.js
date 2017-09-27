const _ = require('lodash');

class Context {
  constructor() {
    this.functionCounter = [];
    this.numStatement = 0;
  }

  /**
   * increase the counter for the given function name
   *
   * @param {*} funName
   */
  increaseCounter(funName) {
    const fCounter = _.find(this.functionCounter, f => _.keys(f).indexOf(funName) >= 0);
    if (fCounter) {
      fCounter[funName] += 1;
    } else {
      this.functionCounter.push({
        [funName]: 1,
      });
    }
  }

  getCounter(funName) {
    const fCounter = _.find(this.functionCounter, f => _.keys(f).indexOf(funName) >= 0);
    if (fCounter) {
      return fCounter[funName];
    }
    return '';
  }

  getFunctionName(funName) {
    // const functionName = funName + this.getCounter(funName);
    // this.increaseCounter(funName);
    return funName;
  }
}

module.exports = Context;
