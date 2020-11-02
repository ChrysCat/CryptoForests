import React from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { observer } from "mobx-react";
import Icon from 'react-native-vector-icons/FontAwesome';
import Lib from './Lib';
import manager from './Manager';

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  async componentDidMount() {
  }

  navigateTo(path) {
    this.props.history.push(path);
  }

  render() {
    const disabled = manager.busy;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="leaf" size={80} />
          <View style={{ height: 10 }} />
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>CRYPTO TREES</Text>
          <Text style={{ textAlign: 'center' }}>BLOCKCHAIN FOR GREEN WORLD</Text>
        </View>
        <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: 'gainsboro' }}>
          <Button disabled={disabled} title='USER MENU' onPress={() => this.navigateTo('/user-home')} />
          <View style={{ height: 10 }} />
          <Button disabled={disabled} title='VENDOR MENU' onPress={() => this.navigateTo('/vendor-home')} />
          <View style={{ height: 10 }} />
          <Button disabled={disabled} title='VALIDATOR MENU' onPress={() => this.navigateTo('/validator-home')} />
        </View>
      </View>
    );
  }

}

export default observer(Home);
