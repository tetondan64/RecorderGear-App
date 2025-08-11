const { Platform } = require('react-native');
const { GlobalAudioManager } = require('./temp/hooks/useGlobalAudioManager.js');

(function run() {
  const manager = GlobalAudioManager.getInstance();

  // Web scenario
  Platform.OS = 'web';
  let queryCalled = false;
  global.document = {
    querySelectorAll: () => {
      queryCalled = true;
      return [{
        paused: false,
        pause() {
          this.paused = true;
        },
        currentTime: 10
      }];
    }
  };
  const webAudio = {
    paused: false,
    pause() {
      this.paused = true;
    },
    currentTime: 5
  };
  manager.setCurrentAudio(webAudio, 'web-file');
  manager.stopAll();
  if (!queryCalled || !webAudio.paused || webAudio.currentTime !== 0) {
    console.error('Web behavior failed');
    process.exit(1);
  }

  // Native scenario
  Platform.OS = 'ios';
  delete global.document;
  const nativeAudio = {
    paused: false,
    pause() {
      this.paused = true;
    },
    currentTime: 7
  };
  manager.setCurrentAudio(nativeAudio, 'native-file');
  try {
    manager.stopAll();
    if (!nativeAudio.paused || nativeAudio.currentTime !== 0) {
      console.error('Native behavior failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('Native behavior threw error', err);
    process.exit(1);
  }

  console.log('GlobalAudioManager platform tests passed');
})();
