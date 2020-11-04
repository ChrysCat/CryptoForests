import React from 'react';
import { View, Text, TextInput, Button, FlatList, ScrollView, Picker, Image } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';
import UploadIPFS from './UploadIPFS';

class UserTreeDetail extends React.Component {
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
    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>TREE PROOFS OF WORK</Text>
        </View>
        {this.renderList()}
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='BACK' onPress={() => this.props.history.goBack()} />
        </View>
      </View>
    );
  }


}

export default observer(UserTreeDetail);
