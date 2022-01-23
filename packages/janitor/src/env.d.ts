declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_REGION: string;
      CHANNELS_TABLE: string;
      DISCORD_TOKEN: string;
      MAPS_BUCKET: string;
      MAPS_TABLE: string;
    }
  }
}

export {};
