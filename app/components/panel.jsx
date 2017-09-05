import React from 'react';

export default class Panel extends React.Component {

  constructor(props) {
    super(props);
    this.state = { shell: '', translate: '' };
  }
  render() {
    return (
      <div>
        <textarea
          value={this.state.shell}
          onChange={e => this.setState({ shell: e.target.value })}
          rows="5"
        />
        <textarea type="text" rows="5" value={this.state.translate} />
        <button
          onClick={() => this.setState({ translate: this.state.shell })}
        >Translate</button>
      </div>);
  }
}
