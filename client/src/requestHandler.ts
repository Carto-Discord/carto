import { GaxiosPromise } from "gaxios";

type ResponseData = {
  created: string;
  blob?: string;
  bucket?: string;
  message?: string;
};

export const handleRequest = async (
  request: () => GaxiosPromise<ResponseData>
) => {
  request().catch((e) =>
    console.warn(`Non-ok response received.\n Error: ${e}`)
  );
};
