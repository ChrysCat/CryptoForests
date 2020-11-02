import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'form'
    };
  }

  async componentDidMount() {
  }

  render() {

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Text>GPS:</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
            onChangeText={(txt) => this.setState({ gps: txt })}
            value={this.state.gps}
            placeholder='ENTER GPS'
          />
          <Text> </Text>
          <Text>Species:</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
            onChangeText={(txt) => this.setState({ species: txt })}
            value={this.state.species}
            placeholder='ENTER SPECIES'
          />
          <Text> </Text>
          <Text>Initial Photo IPFS Hash:</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
            onChangeText={(txt) => this.setState({ initialPhoto: txt })}
            value={this.state.initialPhoto}
            placeholder='ENTER INITIAL PHOTO'
          />
          <Text> </Text>
          <Text>List Price in BTC: (ex: 0.001)</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
            onChangeText={(txt) => this.setState({ listPrice: txt })}
            value={this.state.listPrice}
            placeholder='ENTER LIST PRICE'
          />
          <Text> </Text>
          <Text>Installments in BTC: (ex: 0.0001)</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: 'gainsboro', padding: 10 }}
            onChangeText={(txt) => this.setState({ installments: txt })}
            value={this.state.installments}
            placeholder='ENTER INSTALLMENTS'
          />
          <Text> </Text>
        </View>
        <Button title='CREATE TREE' onPress={() => this.createTree()} />
      </View>
    );
  }
}

export default Page;
