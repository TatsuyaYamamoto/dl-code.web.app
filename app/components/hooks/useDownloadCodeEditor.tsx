import { useEffect, useState } from "react";

import {
  DownloadCodeSet,
  DownloadCodeSetDocument,
} from "../../domains/DownloadCodeSet";
import { Product } from "../../domains/Product";
import { editCounter as editDlCodeUserCounter } from "../../domains/DlCodeUser";

import useAuth from "./useAuth";
import useFirebase from "./useFirebase";

const useDownloadCodeEditor = (product: Product | null) => {
  const { user } = useAuth();
  const { app: firebaseApp } = useFirebase();
  const [codeSets, setCodeSets] = useState<DownloadCodeSet[]>([]);

  useEffect(() => {
    if (!product) {
      setCodeSets([]);
      return;
    }

    const unsubscribe = DownloadCodeSet.watchListByProductRef(
      product.ref,
      (sets) => {
        setCodeSets(sets);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [product]);

  const addDownloadCodeSet = async (
    numberOfCodes: number,
    expiredAt: Date
  ): Promise<void> => {
    if (!product || !user) {
      throw new Error("unexpected.");
    }

    const { current: currentRegisteredCount, limit: maxRegisteredCount } =
      user.counters.downloadCode;

    if (maxRegisteredCount < currentRegisteredCount + numberOfCodes) {
      throw new Error(
        `exceeded. max count. current: ${currentRegisteredCount},  requested: ${numberOfCodes}, limit: ${maxRegisteredCount}`
      );
    }

    await Promise.all([
      editDlCodeUserCounter(
        user,
        "downloadCode",
        currentRegisteredCount + numberOfCodes,
        firebaseApp.firestore()
      ),
      await DownloadCodeSet.create(product.ref, numberOfCodes, expiredAt),
    ]);
  };

  /**
   * DownloadCodeSetを更新する
   *
   * 更新可能param
   *   - description
   *
   * @param id
   * @param edited
   */
  const updateDownloadCodeSet = async (
    id: string,
    edited: Pick<DownloadCodeSetDocument, "description">
  ) => {
    if (!product) {
      return;
    }

    const ref = await DownloadCodeSet.getDocRef(id);
    await ref.update(edited);
  };

  return {
    downloadCodeSets: codeSets,
    addDownloadCodeSet,
    updateDownloadCodeSet,
  };
};

export default useDownloadCodeEditor;
