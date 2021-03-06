import React from 'react';
import { View, Text, Image } from 'react-native';
import RifStorage, { Provider } from '@rsksmart/rif-storage';

const EXIF = require('exif-js');

class UploadIPFS extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: 'btn'
    };
    this.storage = RifStorage(Provider.IPFS, { host: 'ipfs.infura.io', port: '5001', protocol: 'https' });
  }

  async componentDidMount() {
  }

  toBuffer(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();

      function convertDMSToDD(degrees, minutes, seconds, direction) {
        var dd = degrees + minutes/60 + seconds/(60*60);
        if (direction == "S" || direction == "W") {
            dd = dd * -1;
        } // Don't do anything for N or E
        return dd;
      }

      reader.onload = function () {
        const exifData = EXIF.readFromBinaryFile(reader.result);
        console.log({ exifData });
        let gps;
        if (exifData && exifData.GPSLatitude && exifData.GPSLongitude) {
          let lat = convertDMSToDD(exifData.GPSLatitude[0], exifData.GPSLatitude[1], exifData.GPSLatitude[2], exifData.GPSLatitudeRef);
          let long = convertDMSToDD(exifData.GPSLongitude[0], exifData.GPSLongitude[1], exifData.GPSLongitude[2], exifData.GPSLongitudeRef);
          gps = lat + "," + long;
        } else {
          gps = "Unknown";
        }

        console.log(reader.result);
        const buffer = Buffer.from(reader.result);

        resolve({ buffer, gps });
      };

      reader.onerror = function () {
        console.log(reader.error);
        reject(reader.error)
      };

      reader.readAsArrayBuffer(file);
    })
  }

  async captureFile(e) {
    e.stopPropagation();
    e.preventDefault();
    const files = e.target.files;
    const file = files[0];
    const storage = this.storage;
    const { buffer, gps } = await this.toBuffer(file);

    try {
      const hash = await storage.put(buffer);
      const url = 'https://ipfs.infura.io/ipfs/' + hash;

      this.setState({ hash: hash, url: url, gps: gps });
      this.props.onUpload({ hash, url, gps });

    } catch (err) {
      console.error(err);
    }
  }

  render() {
    const ipfsHash = this.state.hash;
    let img = <View style={{ width: 300, height: 200, backgroundColor: 'gray' }} />
    const url = this.state.url;
    const gps = this.state.gps;

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
        <Text>GPS: {gps}</Text>
        <Text>IPFS Hash: {ipfsHash}</Text>
        <Text>URL: {url}</Text>
      </View>
    );
  }
}

export default UploadIPFS;
