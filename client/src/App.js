import React from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';

import Connection from './Connection';
import Wallet from './Wallet';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'busy',
      landscape: false,
      w: Dimensions.get('window').width
    };
  }

  async componentDidMount() {
    const ww = Dimensions.get('window').width;
    const wh = Dimensions.get('window').height;
    if (ww > wh) {
      this.setState({ landscape: true, w: wh });
    }
  }

  componentWillMount() {
  }

  onEnterDashboard() {
    this.setState({ show: 'dashboard' });
  }

  render() {
    let style = { flex: 1, backgroundColor: 'white' };
    let space = 10;
    if (this.state.landscape) {
      const wh = Dimensions.get('window').height;
      const w = wh;
      style = { flex: 1, width: w * (480 / 640), alignSelf: 'center', backgroundColor: 'white' };
      space = 0;
    }

    return (
      <>
        <style type="text/css">{`
          @font-face {
            font-family: 'MaterialIcons';
            src: url(${require('react-native-vector-icons/Fonts/MaterialIcons.ttf')}) format('truetype');
          }

          @font-face {
            font-family: 'FontAwesome';
            src: url(${require('react-native-vector-icons/Fonts/FontAwesome.ttf')}) format('truetype');
          }
        `}</style>

        <View>
          <View style={style}>
            <View style={{ paddingHorizontal: space, backgroundColor: 'white' }}>
              <Text> </Text>
              <Wallet />
              <Text> </Text>
              <Connection />
              <Text> </Text>
            </View>
          </View>
        </View>
      </>
    );
  }

}

export default App;
