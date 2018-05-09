# 基于区块链的众筹系统
#### 冰海原创作品
![](http://cdn.binghai.site/o_1cd1k90p91ndpd0s1fei13a6fd3a.png)
![](http://cdn.binghai.site/o_1cd1k78en1t8g14j31r8o147h1kgna.png)
![](http://cdn.binghai.site/o_1cd1k9b9412rj1rfe1bh61iuj846a.png)
### 智能合约
```
'use strict';

var Activity = function (text) {
  if (text) {
    var o = JSON.parse(text);
    // map 中的序号
    this.index = o.index;
    // 众筹完成标志，0进行中，1众筹成功，2众筹失败
    this.success = o.success;
    // 退款完成标志，0未退款，1退款完毕
    this.refund = o.refund;
    // 该众筹的唯一键，即创建该众筹时的交易哈希
    this.hash  = o.hash;
    // 期望众筹数量
    this.expect = new BigNumber(o.expect);
    // 已众筹量
    this.nowHas = new BigNumber(o.nowHas);
    // 众筹结束时间，该时间前未众筹成功的退给所有众筹者
    this.endTimeTs = new BigNumber(o.endTimeTs);
    // 众筹成功后的支付地址
    this.organization = o.organization;
  }
};

Activity.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
};

var PayRecord = function(text){
	if(text){
		var o = JSON.parse(text);
		// 支付给哪个众筹活动
		this.to = o.to;
		// 付款地址
		this.from = o.from;
		// 支付时间
		this.payTimeTs = o.payTimeTs;
		// 本次交易hash
		this.txHash = o.txHash;
		// 支付量
		this.val = new BigNumber(o.val);
	}
}

PayRecord.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
};

var CrowdFund = function () {
	// 现有多少个众筹
	LocalContractStorage.defineProperty(this, "activitySize");
	// 支付记录
	LocalContractStorage.defineProperty(this, "payRecordSize");

	// 众筹活动记录
	LocalContractStorage.defineMapProperty(this, "activities", {
	    parse: function (text) {
	      return new Activity(text);
	    },
	    stringify: function (o) {
	      return o.toString();
	    }
	  });

	// 支付记录
	LocalContractStorage.defineMapProperty(this, "payRecords", {
	    parse: function (text) {
	      return new PayRecord(text);
	    },
	    stringify: function (o) {
	      return o.toString();
	    }
	  });
};

CrowdFund.prototype = {
	init: function () {this.activitySize = 0;this.payRecordSize=0;},

	// 新建一个众筹，交易hash即为给该支付
	launch:function(organization,expect,endTimeTs){		
		if(endTimeTs < this.getNow()*1000){
			throw new Error("activity must be later than now! yours:"+endTimeTs+",server:"+this.getNow()*1000);
		}

		var ac = new Activity();
		ac.expect = new BigNumber(expect);
		ac.endTimeTs = endTimeTs;
		ac.organization = organization;
		ac.success = 0;
		ac.refund = 0;
		ac.hash = Blockchain.transaction.hash;
		ac.nowHas = new BigNumber(0);
		ac.index = this.activitySize;

		this.activities.put(this.activitySize,ac);
		this.activitySize += 1;
		return ac;
	},

	// 参与众筹
	participate:function(hash){
		var tx_val = Blockchain.transaction.value/1000000000000000000;
		var value = new BigNumber(tx_val);
		
		if(value < 0){
			throw new Error("you should pay more than 0!");
		}

		var pr = new PayRecord();
		var ac = this.getActivity(hash);

		if(!ac){
			throw new Error("activity not exist!");
		}

		if(ac.endTimeTs <= this.getNow()*1000){
			throw new Error("activity has stop !");	
		}

		if(ac.success != 0){
			throw new Error("activity has ended !");	
		}

		ac.nowHas = ac.nowHas.plus(value);

		if(ac.nowHas >= ac.expect){
			ac.success = 1;
			Blockchain.transfer(ac.organization, ac.nowHas*1000000000000000000);
		}

		this.activities.put(ac.index,ac);

		pr.to = hash;
		pr.from = Blockchain.transaction.from;
		pr.payTimeTs = this.getNow();
		pr.txHash = Blockchain.transaction.hash;
		pr.val = value;

		this.payRecords.put(this.payRecordSize,pr);
		this.payRecordSize += 1;

		return pr;
	},

	getNow:function(){
		return Blockchain.transaction.timestamp;
	},
	// 退款
	rollback:function(hash){
		var ac = this.getActivity(hash);
		if(!ac){
			throw new Error("pay record not exist.");
		}

		if(ac.endTimeTs < this.getNow()()){
			throw new Error("pay record not end !");
		}

		if(ac.success == 1){
			throw new Error("activity succeed! you don't need to refund !");
		}

		for(var i = 0;i < this.payRecordSize; i++){
			var item = this.getPayRecord(i);
			if(item.to == hash){
				Blockchain.transfer(item.from, item.val);
			}
		}

		ac.success = 2;
		ac.refund = 1;
		this.activities.put(ac.index,ac);
	},

	getActivityByIndex:function(index){
		return this.activities.get(index);
	},

	// 获取单个众筹
	getActivity:function(hash){
		for(var i = 0;i < this.activitySize;i++){
			var ac = this.activities.get(i);
			if(ac.hash == hash){
				return ac;
			}
		}
		return null;
	},

	// 获取单个支付记录
	getPayRecord:function(index){
		var pr = this.payRecords.get(index);
		if(!pr){
			throw new Error("pay record not exist.");	
		}
		return pr;
	},

	getActivitySize:function(){
		return this.activitySize;
	},

	getPayRecordSize:function(){
		return this.activitySize;
	},

	// 获取支付列表
	getPayRecordList:function(hash){
		var result = [];
		for(var i = 0;i < this.payRecordSize; i++){
			var item = this.getPayRecord(i);
			if(item.to == hash){
				result.push(item);
			}
		}
		return result;
	},

	verifyAddress: function (address) {
	  var result = Blockchain.verifyAddress(address);
	  return {
	    valid: result == 0 ? false : true
	  };
	},

};

module.exports = CrowdFund;
```