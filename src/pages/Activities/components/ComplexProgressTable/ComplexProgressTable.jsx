import React, { Component } from 'react';
import IceContainer from '@icedesign/container';
import { Table, Progress, Button,Feedback,Loading } from '@icedesign/base';
import axios from 'axios';
import EditDialog from './EditDialog';

const Toast = Feedback.toast;
export default class ComplexProgressTable extends Component {
  static displayName = 'ComplexProgressTable';

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);

    // 缓存 table 的请求参数
    this.queryCache = {};
    this.state = {
      contract:"",
      net:"",
      tableData:[],
      loading:true,
    };
  }

  // ICE: React Component 的生命周期

  componentWillMount() {}

  componentDidMount() {
        var thiz =this;
    axios.get('https://wx.nanayun.cn/api?act=72cc7acc445efbb')
      .then(function (response) {
        thiz.setState(response.data,function(){
          console.log(thiz.state);
          thiz.fetchData();
        });
      })
      .catch(function (error) {
        console.log(error);
      });
    
  }

  fetchData = () => {
    var thiz =this;
    thiz.call("getActivitySize","[]",function(data){
      var size = parseInt(data.result);
      for(var i = 0;i < size;i++){
        thiz.addItem4Table(i);
      }
      thiz.setState({loading:false});
    })
  };

  addItem4Table = (index)=>{
    var thiz =  this;
    thiz.call("getActivityByIndex","["+index+"]",function(data){
      console.log(data.result);
      var item = JSON.parse(data.result);
      thiz.setState({tableData:[item,...thiz.state.tableData]})
    });
  }

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


  renderTitle = (value, index, record) => {
    return (
      <div>
        <div style={styles.title}>{record.title}</div>
        <div style={styles.subTitle}>创建时间 {record.createTime}</div>
      </div>
    );
  };

  editItem = (index, record) => {
    EditDialog.show({
      onClose: () => {
        EditDialog.hide();
      },
      onCancel: () => {
        EditDialog.hide();
      },
      onOk: (value) => {
        // TODO: 更新接口，并重新获取数据
        // this.props.updateBindingData('updateRow', {
        //   method: 'post',
        //   data: value
        // }, () => {
        //   this.fetchData();
        // });
        console.log('value', value);
        EditDialog.hide();
      },
      value: record,
    });
  };

  renderOperations = (value, index, record) => {
    if(record.success == 0)
      return (
        <div style={styles.operations}>
          <Button
            style={styles.operationButton}
            onClick={() => this.participate(index, record)}
            shape="text"
          >
            参与
          </Button>
          <Button
            style={styles.operationButton}
            onClick={() => this.editItem(index, record)}
            shape="text"
          >
            查看
          </Button>
        </div>
      );

    if(record.success == 2 && record.refund == 0)
      return (
        <div style={styles.operations}>
          <Button
            style={styles.operationButton}
            onClick={() => this.editItem(index, record)}
            shape="text"
          >
            退款
          </Button>
          <Button
            style={styles.operationButton}
            onClick={() => this.editItem(index, record)}
            shape="text"
          >
            查看
          </Button>
        </div>
      );
  };

  participate = (index,record)=>{
    var val = window.prompt("输入参与NAS额度", 10);
    if(isNaN(val) || val <= 0){
        Toast.error('参与NAS额度必须为数字且必须大于0!');
        return;
    }

    window.postMessage({
            "target": "contentscript",
            "data":{
                "to" : this.state.contract,
                "value" : ""+val,
                "contract" : {
                    "function" : 'participate',
                    "args" : "[\""+record.hash+"\"]"
                }
            },
            "method": "neb_sendTransaction"
        }, "*");
  }

  renderProgress = (value,record,other) => {
    var nowHas = parseInt(other.nowHas);
    var expect = parseInt(other.expect);
    return <Progress percent={other.success == 1?100:(nowHas==0?0:nowHas/expect*100)} />;
  };

  renderStates = (a,b,c)=>{
    var success = parseInt(c.success);
    var refund = parseInt(c.refund);
    if(success == 0) return <span style={{color:'blue'}}> 众筹中 </span>
    if(success == 1) return <span style={{color:'green'}}> 众筹成功 </span>
    if(success == 2) {
      if(refund == 0){
        return <span style={{color:'green'}}> 众筹失败,待退款 </span>
      }
      return <span style={{color:'red'}}> 众筹失败,已退款 </span>
    }
  }

  

  renderTime = (a,b,c)=>{
    var date = new Date(Number(c.endTimeTs));
    var y = date.getFullYear();  
    var m = date.getMonth() + 1;  
    m = m < 10 ? '0' + m : m;  
    var d = date.getDate();  
    d = d < 10 ? ('0' + d) : d;  
    return y + '-' + m + '-' + d;  
  }

  render() {

    return (
      <div className="complex-progress-table">
        <IceContainer style={styles.tableCard}>
          <Loading shape="fusion-reactor" visible={this.state.loading} tip="正在通讯...请稍后..." color="#333" style={{width:'100%'}}>
          <Table
            dataSource={this.state.tableData}
            
            className="basic-table"
            style={styles.basicTable}
            hasBorder={false}
          >
            <Table.Column
              title="唯一哈希"
              dataIndex="hash"
              width={330}
            />
            <Table.Column
              title="完成进度"
              width={150}
              cell={this.renderProgress}
            />
            <Table.Column
              title="状态"
              cell={this.renderStates}
              width={80}
              style={styles.priority}
            />
            <Table.Column
              title="截止时间"
              cell={this.renderTime}
              width={80}
              style={styles.priority}
            />
            <Table.Column
              title="操作"
              width={60}
              cell={this.renderOperations}
            />
          </Table>
          </Loading>
        </IceContainer>
      </div>
    );
  }
}

const styles = {
  tableCard: {
    padding: '10px',
  },
  subTitle: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#999999',
  },
  operationButton: {
    marginRight: '10px',
  },
  priority: {
    width: '70px',
    textAlign: 'center',
  },
  operations: {
    lineHeight: '28px',
  },
  pagination: {
    textAlign: 'right',
    paddingTop: '26px',
  },
};
