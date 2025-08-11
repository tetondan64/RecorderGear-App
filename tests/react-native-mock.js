const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  if (request === 'react-native') {
    return { Platform: { OS: 'web' } };
  }
  if (request === '@react-native-async-storage/async-storage') {
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
      getAllKeys: async () => []
    };
  }
  return originalRequire.apply(this, arguments);
};
