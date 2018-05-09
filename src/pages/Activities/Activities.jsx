import React, { Component } from 'react';
import ComplexProgressTable from './components/ComplexProgressTable';

export default class Activities extends Component {
  static displayName = 'Activities';

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="activities-page">
        <ComplexProgressTable />
      </div>
    );
  }
}
