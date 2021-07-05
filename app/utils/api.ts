import configs from "../configs";
import type { ActivatedProductsDto } from "../functions/api/controller/dto/ActivatedProductsDto";
import { AuditLogDocument } from "../domains/AuditLog";
import { IProduct } from "../domains/Product";
import { IDownloadCode } from "../domains/DownloadCodeSet";

export const initUser = (params: { uid: string; idToken: string }) => {
  return fetch(`${configs.apiBaseUrl}/api/users/${params.uid}/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.idToken}`,
    },
  });
};

export const getProductsByDownloadCode = (
  codes: string[]
): Promise<{
  [code: string]: { product: IProduct; downloadCode: IDownloadCode };
}> => {
  const query = `?codes=${codes.join(",")}`;
  return fetch(`${configs.apiBaseUrl}/api/products/activated${query}`)
    .then((res) => res.json())
    .then((dto: ActivatedProductsDto) => {
      const result: {
        [code: string]: { product: IProduct; downloadCode: IDownloadCode };
      } = {};

      Object.keys(dto).forEach((code) => {
        const verifyResult = dto[code];
        if (!verifyResult) {
          return;
        }
        const { product, downloadCode } = verifyResult;
        result[code] = {
          product: {
            id: product.id,
            name: product.name,
            iconStorageUrl: product.iconStorageUrl,
            description: product.description,
            productFiles: product.productFiles,
            ownerUid: product.ownerUid,
            createdAt: new Date(product.createdAt),
          },
          downloadCode: {
            downloadCodeSetId: downloadCode.downloadCodeSetId,
            productId: downloadCode.productId,
            description: downloadCode.description,
            createdAt: new Date(downloadCode.createdAt),
            expiredAt: new Date(downloadCode.expiredAt),
          },
        };
      });
      return result;
    });
};

export const sendAuditLog = (
  params: Omit<AuditLogDocument, "createdAt">
): boolean => {
  // https://stackoverflow.com/a/31355857
  const data = new Blob([JSON.stringify(params)], {
    type: "application/json",
  });
  return navigator.sendBeacon(`${configs.apiBaseUrl}/api/audit-logs`, data);
};
