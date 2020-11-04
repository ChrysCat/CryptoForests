import React from 'react';
import { View, Text, TextInput, Button, FlatList, ScrollView, Picker, Image, ActivityIndicator } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';
import UploadIPFS from './UploadIPFS';

class ValidatorCheckProof extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'busy',
      hash: ''
    };
  }

  async componentDidMount() {
    const params = this.props.match.params;
    const id = params.id;
    const rows = await manager.nftGetProofOfWorks(id);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.state === 'Pending') {
        const hash = row.hash;
        return this.setState({ show: 'content', hash, proofId: i });
      }
    }
  }

  async setValid() {
    const params = this.props.match.params;
    const id = params.id;
    const proofId = this.state.proofId;

    manager.busy = true;

    try {
      let txHash = await manager.nftValidateProofOfWork(id, proofId);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('SET PROOF OF WORK VALID FAILED');
    }

    manager.busy = false;
  }

  async setInvalid() {
    const params = this.props.match.params;
    const id = params.id;
    const proofId = this.state.proofId;
    console.log({ id, proofId });
    manager.busy = true;

    try {
      let txHash = await manager.nftInvalidateProofOfWork(id, proofId);
      await manager.refresh();
      this.setState({ show: 'success', txHash });
    } catch (err) {
      console.error(err);
      Lib.showToast('SET PROOF OF WORK VALID FAILED');
    }

    manager.busy = false;
  }

  render() {
    const disabled = manager.busy;
    let content = <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} ><ActivityIndicator /></View>;
    if (this.state.show === 'success') {
      content = this.renderSuccess();
    } else if (this.state.show === 'content') {
      content = this.renderContent();
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>VALIDATOR CHECK PROOF</Text>
        </View>
        {content}
      </View>
    );
  }

  renderContent() {
    const disabled = manager.busy;
    const url = 'https://ipfs.infura.io/ipfs/' + this.state.hash;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            style={{ width: 300, height: 200 }}
            source={{ uri: url }}
          />
        </View>
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='SET VALID' onPress={() => this.setValid()} />
          <View style={{ height: 10 }} />
          <Button disabled={disabled} title='SET INVALID' onPress={() => this.setInvalid()} />
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

export default observer(ValidatorCheckProof);
