import { Firestore } from "@google-cloud/firestore";
import { getPublicUrl } from "./storage";

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

export const getCurrentMap = async (channelId: string) => {
  const firestore = new Firestore();
  const channelDoc = await firestore
    .collection("channels")
    .doc(channelId)
    .get();

  if (channelDoc.exists) {
    const { current } = channelDoc.data() as ChannelDocument;
    const publicUrl = getPublicUrl(current);
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
