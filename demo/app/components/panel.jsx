import React from 'react';

import CodeMirror from 'react-codemirror';

import CM from 'codemirror';
import { MongoShellTranslator } from '../../../src/index';
import '../../node_modules/codemirror/lib/codemirror.css';

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
