import React from 'react';

import CodeMirror from 'react-codemirror';
import { Radio, RadioGroup } from '@blueprintjs/core';

import CM from 'codemirror';
import { MongoShellTranslator } from '../../../src/index';
import '../../node_modules/codemirror/lib/codemirror.css';
import { syntaxType } from '../../../src/options';

export default class Panel extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      shell: 'use SampleCollections\n'
        + 'db.explains.find({"user.name.last":"Lee"}, {_id: 0}, 10, 100, 1000) \ndb.test.find() \n'
        + 'var i = db.test.find().toArray() \n'
        + 'i = db.test.find()\n'
        + 'db.test.update({"name":"joey"}, {"name":"mike"}, {multi: true})\n'
        + 'db.test.delete({"name":"joey"})\n'
        + 'db.test.insert({"name":"joey"})\n'
        + 'db.test.insert([{"name":"joey"}])\n'
        + 'db.test.drop()\n',
      translate: '',
      syntax: syntaxType.callback,
    };
  }

  translate () {
    const translator = new MongoShellTranslator(this.state.syntax);
    const value = translator.translate(this.state.shell);
    this.setState({ translate: value });
    const cm = this.editor.getCodeMirror();
    cm && cm.setValue(value);
  }

  render () {
    const options = {
      smartIndent: true,
      readOnly: false,
      lineWrapping: false,
      tabSize: 2,
      matchBrackets: true,
      mode: 'javascript',
      lineNumbers: true,
    };
    return (
      <div>
        <CodeMirror
          autoFocus
          value={this.state.shell}
          onChange={e => this.setState({ shell: e })}
          options={options}
        />
        <RadioGroup
          label="Syntax Choice"
          selectedValue={this.state.syntax}
          onChange={e => this.setState({ syntax: e.target.value })}
        >
          <Radio label="Callback" value={syntaxType.callback} />
          <Radio label="Promise" value={syntaxType.promise} />
          <Radio label="Await" value={syntaxType.await} />
        </RadioGroup>

        <div style={{ height: '50px' }}>
          <button onClick={this.translate.bind(this)}>Translate</button>
        </div>
        <CodeMirror
          value={this.state.translate}
          onChange={() => console.log()}
          options={options}
          codeMirrorInstance={CM}
          ref={(cm) => {
            this.editor = cm;
          }}
        />
      </div>
    );
  }
}
