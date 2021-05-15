import { Firestore } from "@google-cloud/firestore";

type ChannelDocument = {
  current: string;
  history: string[];
};

type MapDocument = {
  columns: number;
  rows: number;
  tokens: {
    colour: string;
    column: string;
    name: string;
    row: number;
    size: number;
  }[];
  url: string;
};

const getPublicUrl = (fileName: string) => {
  const gcsBase = "https://storage.googleapis.com";
  const bucket = process.env.MAP_BUCKET;

  return `${gcsBase}/${bucket}/${fileName}.png`;
};

export const getCurrentMap = async (channelId: string) => {
  const firestore = new Firestore();
  const channelDoc = await firestore
    .collection("channels")
    .doc(channelId)
    .get();

  if (channelDoc.exists) {
    const { current } = channelDoc.data() as ChannelDocument;
    const publicUrl = getPublicUrl(current);
    console.log(`Map image url: ${publicUrl}`);
    const mapDoc = await firestore.collection("maps").doc(current).get();

    if (mapDoc.exists) {
      const { tokens } = mapDoc.data() as MapDocument;

      return {
        publicUrl,
        tokens,
      };
    }
  }
};
