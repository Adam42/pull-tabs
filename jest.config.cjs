module.exports = {
  transform: {
  },
  transformIgnorePatterns: [
    'node_modules/(?!YOUR_MODULE_HERE)',
  ],
  globals: {
    'babel-jest': {
      useESM: true,
    },
  },
};
