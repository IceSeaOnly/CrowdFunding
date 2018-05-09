/* eslint no-underscore-dangle:0 */
import React, { Component } from 'react';
import IceContainer from '@icedesign/container';
import { Table, Pagination, Radio, Search } from '@icedesign/base';
import DataBinder from '@icedesign/data-binder';
import { enquireScreen } from 'enquire-js';
import axios from 'axios';
const { Group: RadioGroup } = Radio;


export default class TimeFilterTable extends Component {
  static displayName = 'TimeFilterTable';

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.queryCache = {};
    this.state = {
      contract:"",
      net:"",
      tableData:[],
      loading:false,
      timeRange: 'day',
      isMobile: false,
    };
  }

  componentDidMount() {
    var thiz =this;
    axios.get('https://wx.nanayun.cn/api?act=72cc7acc445efbb')
      .then(function (response) {
        thiz.setState(response.data,function(){
          console.log(thiz.state);
        });
      })
      .catch(function (error) {
        console.log(error);
      });
    
  }

  enquireScreenRegister = () => {
    const mediaCondition = 'only screen and (max-width: 720px)';

    enquireScreen((mobile) => {
      this.setState({
        isMobile: mobile,
      });
    }, mediaCondition);
  };



  onSearch = (value) => {
    var thiz = this;
    this.setState({loading:true});
    this.call("getPayRecordList","[\""+value.key+"\"]",function(data){
      var arr = JSON.parse(data.result);
      console.log(arr);
      thiz.setState({tableData:arr});
      thiz.setState({loading:false});
    })
  };

  renderOrder = (value, index) => {
    return <span>{index + 1}</span>;
  };

  call = (method,args,func)=>{
    var thiz =this;
    axios.post(thiz.state.net+'/v1/user/call', {
          "from": "n1HYFhQwgC2y2StMpTMSkoHbqSKsZEVErFk",
          "to": thiz.state.contract,
          "value": "0",
          "nonce": 0,
          "gasPrice": "1000000",
          "gasLimit": "2000000",
          "contract": {
              "function": method,
              "args": args
          }
      })
      .then(function (response) {
        func(response.data.result);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  render() {
    return (
      <div className="time-filter-table">
        <IceContainer style={styles.filterCard}>
            <div>
              <Search
                style={styles.search}
                placeholder="请输入唯一哈希"
                searchText=""
                onSearch={this.onSearch}
              />
            </div>
        </IceContainer>
        <IceContainer style={styles.tableCard}>
          <Table
            dataSource={this.state.tableData}
            isLoading={this.state.loading}
            hasBorder={false}
          >
            <Table.Column title="支付时间戳" dataIndex="payTimeTs" width={60}/>
            <Table.Column title="支付NAS数" dataIndex="val" width={50} />
            <Table.Column title="支付地址" dataIndex="from" width={200} />
            <Table.Column title="交易哈希" dataIndex="txHash" width={200} />
          </Table>
        </IceContainer>
      </div>
    );
  }
}

const styles = {
  filterCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pagination: {
    textAlign: 'right',
    paddingTop: '20px',
    paddingBottom: '10px',
  },
  tableCard: {
    padding: '10px',
  },
};
