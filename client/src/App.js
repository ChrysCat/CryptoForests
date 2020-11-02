import React from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import Connection from './Connection';
import Wallet from './Wallet';
import Home from './Home';
import UserHome from './UserHome';
import VendorTreeList from './VendorTreeList';
import VendorTreeCreate from './VendorTreeCreate';
import VendorTreeDetail from './VendorTreeDetail';

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
    const wh = Dimensions.get('window').height;
    let style = { flex: 1, backgroundColor: 'white' };
    let space = 10;
    if (this.state.landscape) {
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

        <View style={{ height: wh, backgroundColor: 'gainsboro' }}>
          <View style={style}>
            <View style={{ flex: 1 }}>
              <Router>
                <Switch>
                  <Route path="/user-home" component={UserHome} />
                  <Route path="/vendor-home" component={VendorTreeList} />
                  <Route path="/vendor-tree-create" component={VendorTreeCreate} />
                  <Route path="/vendor-tree-detail" component={VendorTreeDetail} />
                  <Route path="/" component={Home} />
                </Switch>
              </Router>
            </View>
            <View style={{ height: 10, backgroundColor: 'gainsboro' }} />
            <View style={{ height: 150, justifyContent: 'center' }}>
              <Connection />
            </View>
          </View>
        </View>
      </>
    );
  }

}

export default App;
