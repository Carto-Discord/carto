declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BASE_URL: string;
      ENVIRONMENT?: string;
    }
  }
}

export {};
