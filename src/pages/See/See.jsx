import React, { Component } from 'react';
import TimeFilterTable from './components/TimeFilterTable';

export default class See extends Component {
  static displayName = 'See';

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="see-page">
        <TimeFilterTable />
      </div>
    );
  }
}
