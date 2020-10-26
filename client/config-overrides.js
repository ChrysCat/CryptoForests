const path = require('path');
const { override, addDecoratorsLegacy, disableEsLint, addBabelPlugins, babelInclude } = require('customize-cra');

module.exports = override(
  addDecoratorsLegacy(),

  // disable eslint in webpack
  disableEsLint(),

  // ...addBabelPlugins('@babel/plugin-proposal-class-properties'),

  babelInclude([
    path.resolve(__dirname, 'node_modules/react-native-elements'),
    path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
    path.resolve(__dirname, 'node_modules/react-native-ratings'),
    path.resolve(__dirname, 'src'),
  ])
);
