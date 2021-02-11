const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode : "development",
  module: {
    rules: [
      {
        use: 'ts-loader',
        exclude: [
          /node_modules/,
          '/src/test/'
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'build'),
  },
  devServer : {
    publicPath : '/build/'
  },
};