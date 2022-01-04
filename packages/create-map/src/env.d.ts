declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION: string;
      CHANNELS_TABLE: string;
      MAPS_BUCKET: string;
    }
  }
}

export {};
