import { useCallback } from "react";
import { sendImpression } from "../../utils/api";

const useImpression = () => {
  const postImpression = useCallback(
    async (productId: string, text: string) => {
      await sendImpression({ uid: "anonymous", productId, text });
    },
    []
  );

  return { postImpression };
};

export default useImpression;
