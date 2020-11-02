import React from 'react';
import { View, Button, Text, ActivityIndicator, TextInput, Picker, TouchableOpacity } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';

const clipboardy = require('clipboardy');
const QRCode = require('qrcode.react');

const t = { textAlign: 'center', fontWeight: 'bold' };
const s = { textAlign: 'center' };
const c = { padding: 10, justifyContent: 'center' };

class Connection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'home'
    };
  }

  async componentDidMount() {
    const autoInitMethod = await Lib.getStorageValue('auto_init');
    if (autoInitMethod && autoInitMethod === 'metamask') {
      try {
        await manager.initWallet();
        const address = manager.address;
        return this.setState({ address, show: 'connected' });
      } catch (err) {

      }
    }

    this.setState({ show: 'disconnected' });
  }

  componentWillMount() {
  }

  async startWallet() {
    manager.busy = true;
    try {
      await manager.initWallet();
      await Lib.setStorageValue('auto_init', 'metamask');
      const address = manager.address;
      this.setState({ address, show: 'connected' });
    } catch (err) {
      console.error(err);
      Lib.showToast('CREATE NEW WALLET FAILED');
    }
    manager.busy = false;
  }

  async saveAddress() {
    await clipboardy.write(manager.address);
    Lib.showToast('ADDRESS SAVED TO CLIPBOARD');
  }

  async logout() {
    manager.busy = true;
    await Lib.clearStorageValue();
    window.location.reload();
    return false;
  }

  async refresh() {
    manager.busy = true;
    await manager.refresh();
    manager.busy = false;
  }

  renderHome() {
    const disabled = manager.busy;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={s}>LOGIN TO WALLET</Text>
        </View>
        <View style={{ padding: 10 }}>
          <Button disabled={disabled} title='START' onPress={() => this.startWallet()} />
        </View>
      </View>
    );
  }

  renderConnected() {
    const disabled = manager.busy;
    const address = manager.address;
    const gasSymbol = manager.gasSymbol;
    const gasBalance = manager.gasBalance;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ borderBottomWidth: 1, borderColor: 'gainsboro' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
            <Text>{gasSymbol}</Text>
            <Text>{gasBalance}</Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity disabled={disabled} title='SAVE ADDRESS TO CLIPBOARD' onPress={() => this.saveAddress()}>
            <Text style={s}>WALLET ADDRESS</Text>
            <Text style={s}>{address}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', padding: 10 }}>
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='REFRESH' onPress={() => this.refresh()} />
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Button disabled={disabled} title='LOGOUT' onPress={() => this.logout()} />
          </View>
        </View>
      </View>
    );
  }

  renderBusy() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={s}><ActivityIndicator /></Text>
      </View>
    );
  }


  render() {
    let page;

    if (this.state.show === 'disconnected') {
      page = this.renderHome();
    } else if (this.state.show === 'connected') {
      page = this.renderConnected();
    } else {
      page = this.renderBusy();
    }

    return (
      <View style={{ flex: 1 }}>
        {page}
      </View>
    );
  }

}

export default observer(Connection);

