declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APPLICATION_ID: string;
      BOT_TOKEN: string;
      PUBLIC_KEY: string;
    }
  }
}

export {};
