declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION: string;
      PUBLIC_KEY: string;
      STATE_MACHINE_ARN: string;
    }
  }
}

export {};
