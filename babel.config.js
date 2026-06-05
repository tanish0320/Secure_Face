module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // react-native-reanimated MUST be the last plugin in this list
    'react-native-reanimated/plugin',
  ],
};
