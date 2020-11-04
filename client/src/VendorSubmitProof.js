import React from 'react';
import { View, Text, TextInput, Button, FlatList, ScrollView, Picker, Image } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';
import UploadIPFS from './UploadIPFS';

class VendorSubmitProof extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'content',
      hash: '',
    };
  }

  async componentDidMount() {
    const params = this.props.match.params;
    const id = params.id;
    const rows = await manager.nftGetProofOfWorks(id);
    this.setState({ rows });
  }

  async submitProofOfWork() {
    const hash = this.state.hash;

    if (hash.length === 0) return Lib.showToast('IPFS HASH IS EMPTY');
    const params = this.props.match.params;
    const id = params.id;

    manager.busy = true;

    try {
      let txHash = await manager.nftSubmitProofOfWork(id, hash);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('SUBMIT PROOF OF WORK FAILED');
    }

    manager.busy = false;
  }

  renderRow(item) {

    const hash = item.hash;
    const url = 'https://ipfs.infura.io/ipfs/' + hash;
    const uploadTime = item.uploadTime;
    const state = item.state;

    return (
      <View key={hash} style={{ padding: 10, flexDirection: 'row' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}>
          <Image
            style={{ width: 100, height: 100 }}
            source={{ uri: url }}
          />
        </View>
        <View style={{ flex: 1, paddingLeft: 10, justifyContent: 'center' }}>
          <Text style={{ textAlign: 'left' }}>Upload time: {uploadTime}</Text>
          <Text style={{ textAlign: 'left' }}>State: {state}</Text>
        </View>
      </View>
    );
  }

  renderList() {
    const rows = this.state.rows;

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
    const disabled = manager.busy;
    let content;
    if (this.state.show === 'success') {
      content = this.renderSuccess();
    } else {
      content = this.renderContent();
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>VENDOR SUBMIT PROOF</Text>
        </View>
        {content}
      </View>
    );
  }

  renderContent() {
    const disabled = manager.busy;
    const params = this.props.match;
    const { id, gps, species, state, listPrice, installments } = this.state;

    return (
      <View style={{ flex: 1 }}>
        {this.renderList()}
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Text>New Proof Photo IPFS Hash:</Text>
          <UploadIPFS onUpload={({ hash, url }) => {
            this.setState({ hash: hash })
          }} />
        </View>
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='SUBMIT PROOF' onPress={() => this.submitProofOfWork()} />
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

export default observer(VendorSubmitProof);
