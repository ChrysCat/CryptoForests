import React from 'react';
import { View, Button, Text, ActivityIndicator, TextInput, Picker, TouchableOpacity, FlatList, Image } from 'react-native';
import { observer } from "mobx-react";
import Icon from 'react-native-vector-icons/FontAwesome';
import Lib from './Lib';
import manager from './Manager';

const clipboardy = require('clipboardy');
const t = { textAlign: 'center', fontWeight: 'bold' };
const s = { textAlign: 'center' };
const c = { padding: 10, justifyContent: 'center' };

class UserHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'home',
      toSwap: ''
    };
  }

  componentDidMount() {
  }

  componentWillMount() {
  }

  async saveCoinAddress() {
    await clipboardy.write(manager.coinAddress);
    Lib.showToast('COIN ADDRESS SAVED TO CLIPBOARD');
  }

  async saveNftAddress() {
    await clipboardy.write(manager.coinAddress);
    Lib.showToast('COIN ADDRESS SAVED TO CLIPBOARD');
  }

  async saveToClipboard(name, val) {
    await clipboardy.write(val);
    Lib.showToast(name.toUpperCase() + ' SAVED TO CLIPBOARD');
  }

  renderFooter() {
    const gasSymbol = manager.gasSymbol;
    const gasBalance = manager.gasBalance;
    return (
      <View style={{ borderTopWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
          <Text>{gasSymbol}</Text>
          <Text>{gasBalance}</Text>
        </View>
      </View>
    );
  }

  renderBusy() {
    return (
      <View style={c}>
        <Text> </Text>
        <Text style={s}><ActivityIndicator /></Text>
        <Text> </Text>
      </View>
    );
  }

  renderSimpleVars() {
    const disabled = manager.busy;

    const coinSymbol = manager.coinSymbol;
    const coinBalance = manager.coinBalance;
    const nftBalance = manager.nftBalance;
    const nftSymbol = manager.nftSymbol;

    const big = { textAlign: 'center', fontSize: 30 };

    return (
      <View style={c}>
        <TouchableOpacity onPress={() => this.saveToClipboard(coinSymbol + ' OWNED', coinBalance)}>
          <Text style={big}>{coinBalance}</Text>
          <Text style={s}>{coinSymbol} OWNED</Text>
        </TouchableOpacity>
      </View>
    );
  }

  toPage(name) {
    if (!manager.address) return Lib.showToast('PLEASE LOGIN');
    this.setState({ show: name });
  }

  renderHome() {
    const disabled = manager.busy;
    const btn1 = 'CREATE TREE';
    const btn2 = 'SWAP ' + manager.coinSymbol + ' TO ' + manager.gasSymbol;
    return (
      <View style={c}>
        <Button disabled={disabled} title='TREES FOR SALE' onPress={() => this.props.history.push('/user-for-sale')} />
        <View style={{ height: 10 }} />
        <Button disabled={disabled} title={btn2} onPress={() => this.toPage('inputSwap')} />
        <View style={{ height: 10 }} />
        <Button disabled={disabled} title='BACK' onPress={() => this.props.history.goBack()} />
      </View>
    );
  }

  async checkBuyRequirement() {
    const gasSymbol = manager.gasSymbol;

    manager.busy = true;
    const retCode = await manager.buyNftRequirement();

    if (retCode === 1) {
      manager.busy = false;
      return Lib.showToast('LOG IN FIRST');
    } else if (retCode === 2) {
      const msg = 'BALANCE ' + gasSymbol + ' IS NOT ENOUGH';
      manager.busy = false;
      return Lib.showToast(msg.toUpperCase());
    } else if (retCode === 3) {
      manager.busy = false;
      return this.setState({ show: 'needApproval' });
    }

    try {
      let txHash = await manager.buyNft();
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('BUY NFT FAILED');
    }

    manager.busy = false;
  }

  async checkSwapRequirement() {
    const coinSymbol = manager.coinSymbol;
    const toSwap = this.state.toSwap;

    if (Number(toSwap) > 0) {
    } else {
      return Lib.showToast('INVALID AMOUNT');
    }

    manager.busy = true;
    const retCode = await manager.swapRequirement(toSwap);
    if (retCode === 1) {
      manager.busy = false;
      return Lib.showToast('LOG IN FIRST');
    } else if (retCode === 2) {
      const msg = 'BALANCE ' + coinSymbol + ' IS NOT ENOUGH';
      manager.busy = false;
      return Lib.showToast(msg.toUpperCase());
    }

    try {
      let txHash = await manager.swap(toSwap);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('SWAP FAILED');
    }

    manager.busy = false;
  }

  renderInputBuy() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const coinSymbol = manager.coinSymbol;
    const nftPrice = manager.nftMintCost;
    const nftCoinReward = manager.nftCoinReward;
    const nftSymbol = manager.nftSymbol;

    return (
      <View style={c}>
        <Text style={s}>MINT 1 {nftSymbol} FOR {nftPrice} {gasSymbol}</Text>
        <Text style={s}>AND RECEIVE {nftCoinReward} {coinSymbol} AS REWARD</Text>
        <Text> </Text>
        <Text style={s}>TOKEN {coinSymbol} WILL RECEIVE "INTEREST" OVER TIME</Text>
        <Text style={s}>AND IT TIED TO {gasSymbol} ON RATIO 1:1</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONTINUE' onPress={() => this.checkBuyRequirement()} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );

  }

  renderInputSwap() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const coinSymbol = manager.coinSymbol;

    let from = '0.0';
    if (this.state.toSwap && this.state.toSwap.length > 0 && Number(this.state.toSwap) > 0) {
      from = manager.formatAmount(this.state.toSwap);
    }
    const to = from;

    return (
      <View style={c}>
        <Text style={s}>SWAP {coinSymbol} TO {gasSymbol}</Text>
        <Text style={s}>ENTER AMOUNT {coinSymbol}</Text>
        <TextInput
          disabled={disabled}
          style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
          onChangeText={(txt) => this.setState({ toSwap: txt })}
          value={this.state.toSwap}
        />
        <Text> </Text>
        <Text> </Text>
        <Text style={s}>SWAP {from} {coinSymbol} TO {to} {gasSymbol}</Text>
        <Text style={s}>CLICK CONTINUE TO CONFIRM</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONTINUE' onPress={() => this.checkSwapRequirement()} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );

  }

  renderSuccess() {
    const disabled = manager.busy;
    const { txHash } = this.state;
    return (
      <View style={c}>
        <Text style={s}>TRANSACTION HASH</Text>
        <Text style={{ textAlign: 'center', fontSize: 10 }}>{txHash}</Text>
        <Text> </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='EXPLORE TX' onPress={() => manager.openTx(this.state.txHash)} />
          </View>
          <View style={{ width: 10, height: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='BACK' onPress={() => this.setState({ show: 'home' })} />
          </View>
        </View>
      </View>
    );
  }

  renderRow(item) {
    const id = item[0].toString();
    const json = JSON.parse(item[2]);
    const gps = json.gps;
    const species = json.species;
    const hash = json.initialPhotoIpfsHash;
    const url = 'https://ipfs.infura.io/ipfs/' + hash;

    const states = [
      'For Sale',
      'Pending Validation',
      'Installment Paid',
      'Contract Cancelled',
      'Contract Ended'
    ];

    const listPrice = item[3].toString();
    const installments = item[4];
    const state = states[item[5]];

    return (
      <View key={id} style={{ padding: 10, flexDirection: 'row' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}>
          <Image
            style={{ width: 100, height: 100 }}
            source={{ uri: url }}
          />
        </View>
        <View style={{ flex: 1, paddingLeft: 10, justifyContent: 'center' }}>
          <Text style={{ textAlign: 'left', fontWeight: 'bold' }}>TREE #{id}</Text>
          <Text style={{ textAlign: 'left' }}>GPS: {gps}</Text>
          <Text style={{ textAlign: 'left' }}>Species: {species}</Text>
        </View>
        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => this.exploreNft()}>
          <Icon name="search" size={30} color={'gray'} />
        </TouchableOpacity>
      </View>
    );
  }

  renderList() {
    const rows = manager.ownedTrees;

    return (
      <View style={{ flex: 1 }}>
        <FlatList
          data={rows}
          renderItem={({ item, index }) => this.renderRow(item)}
          ItemSeparatorComponent={() => {
            return (
              <View style={{ backgroundColor: 'gainsboro', height: 1 }} />
            );
          }}
        />
      </View>
    );
  }

  render() {
    let page = this.renderHome();
    if (this.state.show === 'inputBuy') page = this.renderInputBuy();
    else if (this.state.show === 'success') page = this.renderSuccess();
    else if (this.state.show === 'inputSwap') page = this.renderInputSwap();

    return (
      <View style={{ flex: 1, borderWidth: 1, borderColor: 'gainsboro' }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={t}>USER HOME</Text>
        </View>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={t}>OWNED TREES</Text>
          <Text style={{ textAlign: 'center' }}>ERC721 COMPATIBLE</Text>
        </View>
        <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          {this.renderList()}
        </View>
        {this.renderSimpleVars()}
        {page}
      </View>
    );
  }

}

export default observer(UserHome);

