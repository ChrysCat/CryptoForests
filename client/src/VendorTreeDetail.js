import React from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { observer } from "mobx-react";
import Lib from './Lib';
import manager from './Manager';

class VendorTreeCreate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'form'
    };
  }

  async componentDidMount() {
  }

  render() {
    const disabled = manager.busy;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: 'gainsboro' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>VENDOR TREE DETAIL</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>TODO</Text>
        </View>
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='SUBMIT PROOF OF WORK' onPress={() => console.log('todo')} />
          <View style={{ height: 10 }} />
          <Button disabled={disabled} title='BACK' onPress={() => this.props.history.goBack()} />
        </View>
      </View>
    );
  }

}

export default observer(VendorTreeCreate);
