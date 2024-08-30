const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
  addWebpackAlias({
    'stream': require.resolve('stream-browserify'),
  })
);
