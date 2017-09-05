// const esprima = require('esprima')
// let ast = esprima.parseScript('db.test.find({"name":"joey"})', { tolerant: true })
// ast = esprima.tokenize('use test', { tolerant: true })
// console.log(ast)

import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import Panel from './components/panel.jsx';

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root'),
  );
};

render(Panel);

