import React from 'react';
import { View, Text, Image } from 'react-native';

const IpfsHttpClient = require('ipfs-http-client');

class UploadIPFS extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'btn'
    };
    this.ipfs = IpfsHttpClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
  }

  async componentDidMount() {
    const version = await this.ipfs.version();
    console.log(version);

    // add your data to to IPFS - this can be a string, a Buffer,
    // a stream of Buffers, etc
    // const result = await ipfs.add(data);
    // console.log(result);
    // console.log(result.cid.toString());
    // // we loop over the results because 'add' supports multiple 
    // // additions, but we only added one entry here so we only see
    // // one log line in the output
    // for await (const { cid } of results) {
    //   // CID (Content IDentifier) uniquely addresses the data
    //   // and can be used to get it again.
    //   console.log(cid.toString());
    // }

    // https://ipfs.infura.io/ipfs/QmerBxP4f57hMjKVDoExcALxntAJibSwyzjJkRX6bDTwqr

  }

  async captureFile(e) {
    e.stopPropagation();
    e.preventDefault();
    const files = e.target.files;
    const file = files[0];
    const ipfs = this.ipfs;
    try {
      const added = await ipfs.add(
        file, {
        progress: (prog) => console.log(`received: ${prog}`)
      });

      const hash = added.cid.toString();
      const url = 'https://ipfs.infura.io/ipfs/' + hash;

      console.log(added);
      this.setState({ hash: hash, url: url });

      this.props.onUpload({ hash, url });
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    const ipfsHash = this.state.hash;
    let img = <View style={{ width: 300, height: 200, backgroundColor: 'gray' }} />
    const url = this.state.url;

    if (url && url.length > 0) {
      img = <Image
        style={{ width: 300, height: 200 }}
        source={{ uri: url }}
      />;
    }
    return (
      <View style={{ paddingVertical: 10 }}>
        <View style={{ paddingBottom: 10 }}>
          {img}
        </View>
        <div>
          <input type='file' name='input-file' id='input-file' onChange={args => this.captureFile(args)} />
        </div>
        <View style={{ height: 10 }} />
        <Text>IPFS Hash: {ipfsHash}</Text>
        <Text>URL: {url}</Text>
      </View>
    );
  }
}

export default UploadIPFS;
