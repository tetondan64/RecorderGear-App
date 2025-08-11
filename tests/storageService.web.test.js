require('fake-indexeddb/auto');
const { StorageService } = require('./temp/services/storageService.js');

(async function run() {
  const testKey = 'test-key';
  await StorageService.setItem(testKey, 'value');
  const keys = await StorageService.getAllKeys();
  if (keys.includes(testKey)) {
    console.log('Smoke test passed');
  } else {
    console.error('Smoke test failed: key not found', keys);
    process.exit(1);
  }
})();
