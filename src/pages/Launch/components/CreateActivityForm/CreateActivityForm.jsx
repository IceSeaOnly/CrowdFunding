import React, { Component } from 'react';
import IceContainer from '@icedesign/container';
import {
  FormBinderWrapper as IceFormBinderWrapper,
  FormBinder as IceFormBinder,
  FormError as IceFormError,
} from '@icedesign/form-binder';
import {
  Input,
  Button,
  Checkbox,
  Select,
  DatePicker,
  Switch,
  Radio,
  Grid,
  Feedback,Loading 
} from '@icedesign/base';
import axios from 'axios';

const Toast = Feedback.toast;
const { Row, Col } = Grid;

// FormBinder 用于获取表单组件的数据，通过标准受控 API value 和 onChange 来双向操作数据
const CheckboxGroup = Checkbox.Group;
const RadioGroup = Radio.Group;
const { RangePicker } = DatePicker;

// Switch 组件的选中等 props 是 checked 不符合表单规范的 value 在此做转换
const SwitchForForm = (props) => {
  const checked = props.checked === undefined ? props.value : props.checked;

  return (
    <Switch
      {...props}
      checked={checked}
      onChange={(currentChecked) => {
        if (props.onChange) props.onChange(currentChecked);
      }}
    />
  );
};

export default class CreateActivityForm extends Component {
  static displayName = 'CreateActivityForm';

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.state = {
      contractAddr:"",
      loading:false,
      data:{},
      notice:"",
      noticeContent:"",
    };
  }
  componentDidMount(){
    var thiz =this;
    axios.get('https://wx.nanayun.cn/api?act=72cc7acc445efbb')
      .then(function (response) {
        thiz.setState({contractAddr:response.data.contract});
        console.log(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });

      window.addEventListener('message', function(e) {
        if (e.data.data.receipt){
            thiz.handleAfterTx(e.data.data.receipt);
            return;
        }

        if(!e.data.data.neb_call) return;
        var result = JSON.parse(e.data.data.neb_call.result);
        
        thiz.handleAddressValide(result);
      });
  }

  handleAfterTx = (result)=>{
    console.log('handleAfterTx:');
    console.log(result);
    this.setState({notice:'交易成功,请保存交易哈希',noticeContent:result.hash});
  }

  onFormChange = (value) => {
    this.setState({
      value,
    });
  };

  submit = () => {
    this.formRef.validateAll((error, value) => {
      console.log('error', error, 'value', value);
      if (error) {
        return;
      }

      if(isNaN(value.expect) || value.expect <= 0){
        Toast.error('众筹目标必须为数字且必须大于0!');
        return;
      }

      var timestamp = new Date().getTime();
      if(value.endTimeTs > 86400000*30 + timestamp || value.endTimeTs < 86400000*7 + timestamp){
        Toast.error('众筹周期不得少于7天且不得长于1个月');
        return;
      }

      this.setState({data:value});
      this.validateAddress(value.organization)
            
    });
  };

  validateAddress = (addr)=>{
    window.postMessage({
          "target": "contentscript",
          "data":{
              "to" : this.state.contractAddr,
              "value" : "0",
              "contract" : {
                  "function" : 'verifyAddress',
                  "args" : "[\""+addr+"\"]"
              }
          },
          "method": "neb_call"
      }, "*");

    this.setState({loading:true});
  }

  handleAddressValide = (res)=>{
    if(!res){
      this.setState({loading:false});
      Toast.error('通讯故障!');
      return;
    }

    if(!res.valid){
      this.setState({loading:false});
      Toast.error('地址校验不通过!');
    }

    this.setState({loading:false});
    this.lauchNewActivity();
  }

  lauchNewActivity = ()=>{
    console.log(this.state.data);

    window.postMessage({
            "target": "contentscript",
            "data":{
                "to" : this.state.contractAddr,
                "value" : "0",
                "contract" : {
                    "function" : 'launch',
                    "args" : "[\""+this.state.data.organization+"\",\""+this.state.data.expect+"\",\""+this.state.data.endTimeTs+"\"]"
                }
            },
            "method": "neb_sendTransaction"
        }, "*");
    this.setState({loading:true});
    this.setState({notice:'等待交易结果...'});
  }

  render() {
    return (
      <div className="create-activity-form">
        
        <IceContainer title="发起众筹" style={styles.container}>
          <h2 style={{color:'red'}}>系统须知：</h2>
          <span style={{color:'red'}}>· 请从测试网操作!</span><br/>
          <span style={{color:'red'}}>· 请务必安装chrome插件后操作</span><br/>
          <span>· 如未安装，请<a href="https://github.com/ChengOrangeJu/WebExtensionWallet" target="_blank">点击下载安装</a></span><br/>
          
          <h2 style={{color:'red'}}>发起须知：</h2>
          <span>· 打款地址为众筹成功后的转账地址</span><br/>
          <span>· 众筹周期<span style={{color:'red'}}>不得少于7天且不得长于1个月</span></span><br/>
          <span>· 到达结束时间仍未众筹成功的，退款会退换至参与众筹人员的<span style={{color:'red'}}>原支付地址</span></span><br/>
          <span>· 众筹目标以NAS为单位</span><br/>

          <h2 style={{color:'red'}}>{this.state.notice}</h2>
          <p style={{width:'500px'}}>{this.state.noticeContent}</p><br/>

          <br/><br/>
          <h2 >请填写发起表单：</h2>

          <Loading shape="fusion-reactor" visible={this.state.loading} tip="正在通讯...请稍后..." color="#333" style={{width:'100%'}}>
        
          <IceFormBinderWrapper
            ref={(formRef) => {
              this.formRef = formRef;
            }}
            value={this.state.value}
            onChange={this.onFormChange}
          >
            <div>
              <Row style={styles.formItem}>
                <Col xxs="6" s="2" l="2" style={styles.formLabel}>
                  打款地址：
                </Col>

                <Col s="12" l="10">
                  <IceFormBinder
                    name="organization"
                    required
                    message="请填写众筹成功后的打款地址"
                  >
                    <Input style={{ width: '100%' }} />
                  </IceFormBinder>
                  <IceFormError name="organization" />
                </Col>
              </Row>

              <Row style={styles.formItem}>
                <Col xxs="6" s="2" l="2" style={styles.formLabel}>
                  众筹目标：
                </Col>

                <Col s="12" l="10">
                  <IceFormBinder
                    name="expect"
                    required
                    message="必填内容！以NAS代币为单位"
                  >
                    <Input style={{ width: '100%' }} />
                  </IceFormBinder>
                  <IceFormError name="expect" />
                </Col>
              </Row>

              <Row style={styles.formItem}>
                <Col xxs="6" s="2" l="2" style={styles.formLabel}>
                  截止时间：
                </Col>
                <Col s="12" l="10">
                  <IceFormBinder
                    name="endTimeTs"
                    required
                    // 使用 RangePicker 组件输出的第二个参数字符串格式的日期
                    valueFormatter={(date, dateStr) => date.getTime()}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </IceFormBinder>
                </Col>
              </Row>

              <Row style={styles.btns}>
                <Col xxs="6" s="2" l="2" style={styles.formLabel}>
                  {' '}
                </Col>
                <Col s="12" l="10">
                  <Button type="primary" onClick={this.submit}>
                    立即创建
                  </Button>
                </Col>
              </Row>
            </div>
          </IceFormBinderWrapper>
          </Loading>
        </IceContainer>
      </div>
    );
  }
}

const styles = {
  container: {
    paddingBottom: 0,
  },
  formItem: {
    height: '28px',
    lineHeight: '28px',
    marginBottom: '25px',
  },
  formLabel: {
    textAlign: 'right',
  },
  btns: {
    margin: '25px 0',
  },
  resetBtn: {
    marginLeft: '20px',
  },
};
