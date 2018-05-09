import React, { Component } from 'react';
import CreateActivityForm from './components/CreateActivityForm';

export default class Launch extends Component {
  static displayName = 'Launch';

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="launch-page">
        <CreateActivityForm />
      </div>
    );
  }
}
