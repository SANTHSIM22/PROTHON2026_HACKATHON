const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup.jsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { chrome: "110" }
              }],
              ['@babel/preset-react', {
                runtime: 'automatic'
              }]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/background.js', to: 'background.js' },
        { from: 'src/content.js', to: 'content.js' },
        { from: 'src/offscreen.js', to: 'offscreen.js' },
        { from: 'src/offscreen.html', to: 'offscreen.html' },
        { from: 'popup.html', to: 'popup.html' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ],
  devtool: false
};