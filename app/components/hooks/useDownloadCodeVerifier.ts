import { useCallback, useState } from "react";
import Dexie from "dexie";

import { LogType } from "../../domains/AuditLog";

import { IProduct } from "../../domains/Product";
import useAuditLogger from "./useAuditLogger";
import { getProductsByDownloadCode as getProductsByDownloadCodeApi } from "../../utils/api";

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

const db = new DlCodeDb();

const log = (message?: any, ...optionalParams: any[]): void => {
  // tslint:disable-next-line
  console.log(`[useDownloadCodeVerifier] ${message}`, ...optionalParams);
};

interface ActiveProduct {
  product: IProduct;
  expiredAt: Date;
}

const useDownloadCodeVerifier = () => {
  const { okAudit, errorAudit } = useAuditLogger();
  const [actives, setActives] = useState<ActiveProduct[]>([]);

  const loadFromDb = useCallback(async () => {
    const activeProducts = await db.activeProducts.toArray();
    const codes = activeProducts.map(({ downloadCode }) => downloadCode);
    const verifyResults = await getProductsByDownloadCodeApi(codes);

    const actives = codes
      .filter((code) => verifyResults[code])
      .map((code) => {
        const verifyResult = verifyResults[code];
        return {
          product: verifyResult.product,
          expiredAt: verifyResult.downloadCode.expiredAt,
        };
      });

    loadActives(actives);
  }, []);

  /**
   * DownloadCodeを検証する。正常な文字列の場合、productを読み込む
   * @param code
   */
  const verifyDownloadCode = async (code: string) => {
    const verifyResults = await getProductsByDownloadCodeApi([code]);
    const result = verifyResults[code];

    // TODO: check code is expired too!
    if (!result) {
      const e = new Error("provided code is not valid.");

      errorAudit({
        type: LogType.ACTIVATE_WITH_DOWNLOAD_CODE,
        params: { code },
        error: e,
      });
      throw e;
    }

    const { product, downloadCode } = result;
    const verifiedProductId = product.id;
    const expiredAt = downloadCode.expiredAt;

    const targetProduct = await db.getProductById(verifiedProductId);
    if (!!targetProduct /* exists */) {
      log("requested product is already registered.");
      okAudit({
        type: LogType.ACTIVATE_WITH_DOWNLOAD_CODE,
        params: { code, alreadyRegistered: true },
      });
      return;
    }

    okAudit({
      type: LogType.ACTIVATE_WITH_DOWNLOAD_CODE,
      params: { code },
    });

    loadActives([{ product, expiredAt: downloadCode.expiredAt }]);
    db.addNewProduct(code, verifiedProductId, expiredAt);
  };

  /**
   * IDから {@link ActiveProduct} を取得する
   *
   * @public
   */
  const getByProductId = async (
    id: string
  ): Promise<ActiveProductSchema | undefined> => {
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
  const checkLinkedResources = async (
    downloadCode: string
  ): Promise<{
    productId: string;
    productName: string;
    downloadCodeCreatedAt: Date;
    downloadCodeExpireAt: Date;
  } | void> => {
    const verifyResults = await getProductsByDownloadCodeApi([downloadCode]);
    const verifyResult = verifyResults[downloadCode];

    if (!verifyResult /* invalid */) {
      log("invalid download code.");
      return;
    }

    return {
      productId: verifyResult.product.id,
      productName: verifyResult.product.name,
      downloadCodeCreatedAt: verifyResult.downloadCode.createdAt,
      downloadCodeExpireAt: verifyResult.downloadCode.expiredAt,
    };
  };

  /**
   * @private
   */
  const loadActives = (data: { product: IProduct; expiredAt: Date }[]) => {
    const names = data.map(({ product }) => product.name);
    log(`load active product info from remote db.`, names);

    setActives((prev) => {
      const next = [...data];
      const newIds = data.map(({ product }) => product.id);
      prev.forEach((currentItem) => {
        if (!newIds.includes(currentItem.product.id)) {
          next.push(currentItem);
        }
      });
      return next;
    });
  };

  return {
    loadFromDb,
    actives,
    verifyDownloadCode,
    getByProductId,
    checkFormat,
    checkLinkedResources,
  };
};

export default useDownloadCodeVerifier;
