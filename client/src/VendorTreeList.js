import React from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Image } from 'react-native';
import { observer } from "mobx-react";
import Icon from 'react-native-vector-icons/FontAwesome';
import Lib from './Lib';
import manager from './Manager';

class VendorTreeList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'form'
    };
  }

  async componentDidMount() {
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
      'Contract Running',
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
          <Text style={{ textAlign: 'left' }}>State: {state}</Text>
        </View>
        <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => this.props.history.push('/vendor-submit-proof/' + id)}>
          <Icon name="camera" size={30} color={'gray'} title="Submit proof"/>
        </TouchableOpacity>
      </View>
    );
  }

  renderList() {
    const rows = manager.vendorTrees;

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
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>TREES LISTED BY YOU</Text>
        </View>
        {this.renderList()}
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='LIST NEW TREE' onPress={() => this.props.history.push('/vendor-tree-create')} />
          <View style={{ height: 10 }} />
          <Button disabled={disabled} title='BACK' onPress={() => this.props.history.goBack()} />
        </View>
      </View>
    );
  }

}

export default observer(VendorTreeList);
