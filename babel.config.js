module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@app': './src/app',
          '@components': './src/components',
          '@features': './src/features',
          '@lib': './src/lib',
          '@styles': './src/styles',
        },
      },
    ],
    'react-native-reanimated/plugin'
  ],
};
