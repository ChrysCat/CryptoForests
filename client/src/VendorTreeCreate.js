import React from 'react';
import { View, Text, TextInput, Button, FlatList, ScrollView, Picker } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';
import UploadIPFS from './UploadIPFS';

class VendorTreeCreate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'form',
      gps: ' ',
      species: 'Oak',
      listPrice: '0.0001',
      installments: '12'
    };
  }

  async componentDidMount() {
  }

  async create() {
    const { gps, species, initialPhotoIpfsHash, listPrice, installments } = this.state;
    const data = JSON.stringify({
      gps,
      species,
      initialPhotoIpfsHash
    });

    manager.busy = true;

    try {
      let txHash = await manager.nftSetTree(data, listPrice, installments);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('LIST TREE FAILED');
    }

    manager.busy = false;
  }

  render() {
    const disabled = manager.busy;
    let content;
    if (this.state.show === 'success') {
      content = this.renderSuccess();
    } else {
      content = this.renderForm();
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>LIST A TREE</Text>
        </View>
        {content}
      </View>
    );
  }

  renderForm() {
    const disabled = manager.busy;
    const items = [
      { label: 'Banyan', value: 'Banyan' },
      { label: 'Elm', value: 'Elm' },
      { label: 'Mango', value: 'Mango' },
      { label: 'Neem', value: 'Neem' },
      { label: 'Oak', value: 'Oak' },
      { label: 'Pine', value: 'Pine' },
      { label: 'Other', value: 'Other' }
    ];
    const installments = [
      { label: '3 months', value: '3' },
      { label: '6 months', value: '6' },
      { label: '12 months', value: '12' },
      { label: '24 months', value: '24' }
    ];
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 10 }}>
          <ScrollView style={{}}>
            {/* <Text>GPS:</Text>
            <TextInput
              disabled={true}
              style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
              onChangeText={(txt) => this.setState({ gps: txt })}
              value={this.state.gps}
              placeholder='GPS'
            />
            <Text> </Text> */}
            <Text>Species:</Text>
            <Picker
              style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
              disabled={disabled}
              selectedValue={this.state.species}
              onValueChange={(itemValue) => this.setState({ species: itemValue })}
            >
              {items.map((item, i) => {
                const label = item.label;
                const value = item.value;
                return (
                  <Picker.Item key={value} label={label} value={value} />
                );
              })}

            </Picker>
            <Text> </Text>
            <Text>List Price in BTC: (ex: 0.001)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
              onChangeText={(txt) => this.setState({ listPrice: txt })}
              value={this.state.listPrice}
              placeholder='ENTER LIST PRICE'
            />
            <Text> </Text>
            <Text>Installments:</Text>
            <Picker
              style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
              disabled={disabled}
              selectedValue={this.state.installments}
              onValueChange={(itemValue) => this.setState({ installments: itemValue })}
            >
              {installments.map((item, i) => {
                const label = item.label;
                const value = item.value;
                return (
                  <Picker.Item key={value} label={label} value={value} />
                );
              })}

            </Picker>
            <Text> </Text>
            <Text>Photo:</Text>
            <UploadIPFS onUpload={({ hash, url, gps }) => {
              this.setState({ initialPhotoIpfsHash: hash, gps: gps })
            }} />
          </ScrollView>
        </View>
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='CREATE' onPress={() => this.create()} />
          <View style={{ height: 10 }} />
          <Button disabled={disabled} title='BACK' onPress={() => this.props.history.goBack()} />
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


}

export default observer(VendorTreeCreate);
