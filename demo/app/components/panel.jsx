import React from 'react';

import * as esprima from 'esprima';

const estraverse = require('estraverse');
const escodegen = require('escodegen');

// ast = esprima.tokenize('use test', { tolerant: true })
// console.log(ast)
export default class Panel extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      shell: 'db.test.find({"name":"joey"}, {_id: 0})',
      translate: '',
    };
  }

  translate () {
    console.log('esprima:', esprima);
    const ast = esprima.parseScript(this.state.shell, {
      tolerant: true,
      raw: true,
      tokens: true,
      range: true,
      comment: true,
    });
    // console.log(escodegen.generate(ast));
    console.log(ast);
    estraverse.traverse(ast, {
      enter: (node, parent) => {
        if (node.type === 'CallExpression') {
          // console.log('enter:', node);
          const callee = node.callee;
          if (node.callee.type === 'MemberExpression' &&
            node.callee.property.name === 'find') {
            node.mongoShellType = 'find';
            console.log('enter:', node);
            let query;
            let fields;
            if (node.arguments.length > 0) {
              node.arguments.map((argument, i) => {
                if (i === 0) {
                  query = escodegen.generate(argument);
                } else if (i === 1) {
                  fields = escodegen.generate(argument);
                }
              });
            }
            if (callee.object.type === 'MemberExpression') {
              const object = {};
              object.type = 'CallExpression';
              object.arguments = [{ type: 'Literal', value: callee.object.property.name }];
              object.callee = {};
              object.callee.type = 'MemberExpression';
              object.callee.property = {};
              object.callee.property.name = 'collection';
              object.callee.property.type = 'Identifier';
              object.callee.object = {};
              object.callee.object.name = 'db';
              object.callee.object.type = 'Identifier';
              callee.object = object;
            }
            if (parent.type === 'VariableDeclarator' || parent.type === 'ExpressionStatement') {
              if (!node.property) {
                node.type = 'CallExpression';
                node.callee = { type: 'MemberExpression',
                  object: { ...node },
                  property: { type: 'Identifier', name: 'toArray' },
                };
                node.arguments = [];
                console.log('new node', node);
              }
            }
          }
        }
      },
      leave: (node, parent) => {
        if (node.type === 'CallExpression') {
          if (node.mongoShellType === 'find') {

          }
        }
      },
    });
    this.setState({ translate: escodegen.generate(ast) });
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
