declare global {
  namespace NodeJS {
    interface ProcessEnv {
      KEY_API: 'your-api-key';
    }
  }
}

export {}