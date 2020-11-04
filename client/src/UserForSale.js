import React from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Image } from 'react-native';
import { observer } from "mobx-react";
import Icon from 'react-native-vector-icons/FontAwesome';
import Lib from './Lib';
import manager from './Manager';

const utils = require('ethers').utils;

class UserForSale extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'form'
    };
  }

  async componentDidMount() {
  }

  async checkBuyRequirement(id) {
    const gasSymbol = manager.gasSymbol;

    manager.busy = true;
    const retCode = await manager.nftBuyTreeRequirement(id);

    if (retCode === 1) {
      manager.busy = false;
      return Lib.showToast('LOG IN FIRST');
    } else if (retCode === 2) {
      const msg = 'BALANCE ' + gasSymbol + ' IS NOT ENOUGH';
      manager.busy = false;
      return Lib.showToast(msg.toUpperCase());
    }

    try {
      let txHash = await manager.nftBuyTree(id);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('BUY NFT FAILED');
    }

    manager.busy = false;
  }

  renderRow(item) {
    const gasSymbol = manager.gasSymbol;
    const id = item[0].toString();
    const json = JSON.parse(item[2]);
    const gps = json.gps;
    const species = json.species;
    const hash = json.initialPhotoIpfsHash;
    const url = 'https://ipfs.infura.io/ipfs/' + hash;

    const states = [
      'For Sale',
      'Pending Validation',
      'Contract Running',
      'Contract Cancelled',
      'Contract Ended'
    ];

    const listPrice = utils.formatEther(item[3].toString());
    const installments = item[4];
    const state = states[item[5]];
    const price = utils.formatEther(item[6].toString());

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
          <Text style={{ textAlign: 'left' }}>Installments: {listPrice} {gasSymbol} x {installments} months</Text>
          <Text style={{ textAlign: 'left' }}>Price: {price} {gasSymbol}</Text>
        </View>
        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}
          onPress={() => this.setState({ show: 'confirm', item: item })}>
          <Icon name="money" size={30} color={'gray'} />
        </TouchableOpacity>
      </View>
    );
  }

  renderList() {
    const disabled = manager.busy;
    const rows = manager.saleTrees;

    return (
      <View style={{ flex: 1 }}>
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
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='BACK' onPress={() => this.props.history.goBack()} />
        </View>
      </View>
    );
  }

  renderConfirm() {
    const disabled = manager.busy;
    const gasSymbol = manager.gasSymbol;
    const coinSymbol = manager.coinSymbol;

    const item = this.state.item;

    const id = item[0].toString();
    const installments = item[4];
    const listPrice = item[3];
    const ip = listPrice.mul(installments);
    let price = item[6];
    const toMintCoin = price.sub(ip);
    let reward = toMintCoin.div(2);

    reward = utils.formatEther(reward.toString());
    price = utils.formatEther(price.toString());

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center' }}>PLANT THIS TREE FOR {price} {gasSymbol}</Text>
          <Text style={{ textAlign: 'center' }}>AND RECEIVE {reward} {coinSymbol} AS REWARD</Text>
          <Text> </Text>
          <Text style={{ textAlign: 'center' }}>TOKEN {coinSymbol} WILL RECEIVE "INTEREST" OVER TIME</Text>
          <Text style={{ textAlign: 'center' }}>AND IT TIED TO {gasSymbol} ON RATIO 1:1</Text>
        </View>
        <View style={{ padding: 10, flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CONTINUE' onPress={() => this.checkBuyRequirement(id)} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='CANCEL' onPress={() => this.setState({ show: 'list' })} />
          </View>
        </View>
      </View>
    );
  }

  renderSuccess() {
    const disabled = manager.busy;
    const { txHash } = this.state;
    return (
      <View style={{ flex: 1, padding: 10 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center' }}>TRANSACTION HASH</Text>
          <Text style={{ textAlign: 'center', fontSize: 10 }}>{txHash}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='EXPLORE TX' onPress={() => manager.openTx(this.state.txHash)} />
          </View>
          <View style={{ width: 10, height: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='BACK' onPress={() => this.props.history.goBack()} />
          </View>
        </View>
      </View>
    );
  }

  render() {
    const disabled = manager.busy;

    let content;
    if (this.state.show === 'confirm') content = this.renderConfirm();
    else if (this.state.show === 'success') content = this.renderSuccess();
    else content = this.renderList();
    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>TREES FOR SALE</Text>
        </View>
        {content}
      </View>
    );
  }

}

export default observer(UserForSale);
