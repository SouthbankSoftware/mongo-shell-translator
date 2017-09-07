import React from 'react';

import * as esprima from 'esprima';

const estraverse = require('estraverse');
const escodegen = require('escodegen');

import { MongoShellTranslator } from '../../../src/index';

// ast = esprima.tokenize('use test', { tolerant: true })
// console.log(ast)
export default class Panel extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      shell: 'db.test.find({"name":"joey"}, {_id: 0}) \n db.test.find() \n '
        + 'var i = db.test.find().toArray() \n '
        + 'i = db.test.find()\n',
      translate: '',
    };
  }

  translate () {
    const translator = new MongoShellTranslator();
    this.setState({ translate: translator.translate(this.state.shell) });
  }

  render () {
    return (
      <div>
        <textarea
          value={this.state.shell}
          onChange={e => this.setState({ shell: e.target.value })}
          rows="20"
          cols="50"
          style={{ fontSize: 'x-large' }}
        />
        <textarea
          type="text"
          rows="20"
          cols="50"
          style={{ fontSize: 'x-large' }}
          value={this.state.translate}
        />
        <button onClick={this.translate.bind(this)}>Translate</button>
      </div>
    );
  }
}
