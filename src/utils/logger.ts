const Logger = {
  info: (tag: string, message: string, data?: unknown) => {
    if (__DEV__) {
      console.log(`[${tag}] ${message}`, data ?? '');
    }
  },
  warn: (tag: string, message: string, data?: unknown) => {
    if (__DEV__) {
      console.warn(`[${tag}] ${message}`, data ?? '');
    }
  },
  error: (tag: string, message: string, error?: unknown) => {
    console.error(`[${tag}] ${message}`, error ?? '');
  },
};

export default Logger;
