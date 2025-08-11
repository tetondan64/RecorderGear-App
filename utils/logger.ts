const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
const debugFlag = process.env.EXPO_PUBLIC_DEBUG?.toLowerCase() === 'true';
const enableDebug = isDev || debugFlag;

const logger = {
  log: (...args: any[]) => {
    if (enableDebug) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (enableDebug) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};

export default logger;
