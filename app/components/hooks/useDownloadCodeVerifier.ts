import { useEffect, useState, useCallback } from "react";
import Dexie from "dexie";

import firebase from "firebase/app";

import { LogType } from "../../domains/AuditLog";
import {
  DownloadCodeSet,
  DownloadCodeSetDocument,
} from "../../domains/DownloadCodeSet";

import { Product } from "../../domains/Product";
import useAuditLogger from "./useAuditLogger";
import useFirebase from "./useFirebase";
import { verifyDownloadCode as verifyDownloadCodeApi } from "../../utils/api";

type FirebaseApp = firebase.app.App;
type Timestamp = firebase.firestore.Timestamp;

interface ActiveProductSchema {
  downloadCode: string;
  productId: string;
  expiredAt: Date;
}

//
// Declare Database
//
class DlCodeDb extends Dexie {
  public activeProducts: Dexie.Table<ActiveProductSchema, string>;

  public constructor() {
    super("dlCodeDb");
    this.version(1).stores({
      activeProducts: "productId,downloadCode",
    });
    this.activeProducts = this.table("activeProducts");
  }

  public getProductById(id: string) {
    return this.activeProducts.get({
      productId: id,
    });
  }

  public addNewProduct(
    downloadCode: string,
    productId: string,
    expiredAt: Date
  ) {
    return this.transaction("rw", this.activeProducts, () => {
      return this.activeProducts.add({
        downloadCode,
        productId,
        expiredAt,
      });
    });
  }
}

const log = (message?: any, ...optionalParams: any[]): void => {
  // tslint:disable-next-line
  console.log(`[useDownloadCodeVerifier] ${message}`, ...optionalParams);
};

interface ActiveProduct {
  product: Product;
  expiredAt: Date;
}

const useDownloadCodeVerifier = (preventLoadActives: boolean = false) => {
  const { okAudit, errorAudit } = useAuditLogger();
  const [actives, setActives] = useState<ActiveProduct[] | "processing">(
    "processing"
  );
  const { app: firebaseApp } = useFirebase();

  useEffect(() => {
    if (!preventLoadActives) {
      const db = new DlCodeDb();
      loadActives(firebaseApp, db);
    } else {
      log(`not loaded active products according to preventLoadActives flag.`);
    }
    // TODO
    // eslint-disable-next-line
  }, [firebaseApp]);

  /**
   * DownloadCodeを検証する。正常な文字列の場合、productを読み込む
   * @param code
   */
  const verifyDownloadCode = async (code: string) => {
    const result = await verifyDownloadCodeApi({
      downloadCode: code,
    });

    // TODO: check code is expired too!
    if (!result.valid) {
      const e = new Error("provided code is not valid.");

      errorAudit({
        type: LogType.ACTIVATE_WITH_DOWNLOAD_CODE,
        params: { code },
        error: e,
      });
      throw e;
    }

    const { productId: verifiedProductId, expiredAt } = result.data;

    const db = new DlCodeDb();
    const targetProduct = await db.getProductById(verifiedProductId);

    if (!!targetProduct /* exists */) {
      log("requested product is already registered.");

      okAudit({
        type: LogType.ACTIVATE_WITH_DOWNLOAD_CODE,
        params: {
          code,
          alreadyRegistered: true,
        },
      });

      return;
    }

    okAudit({
      type: LogType.ACTIVATE_WITH_DOWNLOAD_CODE,
      params: { code },
    });

    await db.addNewProduct(code, verifiedProductId, expiredAt);
    await loadActives(firebaseApp, db);
  };

  /**
   * IDから {@link ActiveProduct} を取得する
   *
   * @public
   */
  const getByProductId = async (
    id: string
  ): Promise<ActiveProductSchema | undefined> => {
    const db = new DlCodeDb();
    return db.getProductById(id);
  };

  /**
   * DownloadCode付きURLの文字列形式を検証する。
   * 正常な文字列の場合、DownloadCodeのみの文字列を返す
   *
   * @public
   */
  const checkFormat = (decoded: string) => {
    log(`QRCode is found. decoded: ${decoded}`);

    const validFormat = new RegExp(
      "https://dl-code.web.app/d/\\?c=[A-Z2-9]{8}"
    ).test(decoded);

    if (!validFormat) {
      log("unexpected qrcode.");
      return;
    }

    const downloadCode = decoded.replace("https://dl-code.web.app/d/?c=", "");
    log(`Decoded text is expected URL format. download code: ${downloadCode}`);

    return downloadCode;
  };

  /**
   * 引数の{@link downloadCode}に紐付いたリソース情報を取得する
   */
  const checkLinkedResources = useCallback(
    async (
      downloadCode: string
    ): Promise<{
      productId: string;
      productName: string;
      downloadCodeCreatedAt: Date;
      downloadCodeExpireAt: Date;
    } | void> => {
      const snap = await DownloadCodeSet.getColRef()
        .where(`codes.${downloadCode}`, "==", true)
        .get();

      if (snap.empty) {
        log("non-existed download code.");
        return;
      }

      const downloadCodeSetDoc = snap.docs[0].data() as DownloadCodeSetDocument;
      const productId = downloadCodeSetDoc.productRef.id;

      const product = await Product.getById(productId, firebaseApp.firestore());

      if (!product) {
        return;
      }

      return {
        productId: product.id,
        productName: product.name,
        downloadCodeCreatedAt: (
          downloadCodeSetDoc.createdAt as Timestamp
        ).toDate(),
        downloadCodeExpireAt: (
          downloadCodeSetDoc.expiredAt as Timestamp
        ).toDate(),
      };
    },
    [firebaseApp]
  );

  /**
   * @private
   */
  const loadActives = async (app: FirebaseApp, db: DlCodeDb) => {
    const activeProductsInDb = await db.activeProducts.toArray();
    const activeProductIds = activeProductsInDb.map(
      ({ productId }) => productId
    );
    log(`load active product from indexeddb.`, activeProductIds);

    const activeProducts = (
      await Promise.all(
        activeProductsInDb.map(async ({ productId, expiredAt }) => {
          const product = await Product.getById(productId, app.firestore());
          return product ? { product, expiredAt } : null;
        })
      )
    ).filter((activate): activate is ActiveProduct => !!activate);

    const activeProductNames = activeProducts.map(({ product: p }) => p.name);
    log(`load active product info from remote db.`, activeProductNames);

    setActives(activeProducts);
  };

  return {
    actives,
    verifyDownloadCode,
    getByProductId,
    checkFormat,
    checkLinkedResources,
  };
};

export default useDownloadCodeVerifier;
