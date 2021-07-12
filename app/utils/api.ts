import { API_BASE_URL } from "../configs";
import type { ActivatedProductsDto } from "../functions/api/controller/dto/ActivatedProductsDto";
import { AuditLogDocument } from "../domains/AuditLog";
import { IProduct } from "../domains/Product";
import { IDownloadCode } from "../domains/DownloadCodeSet";

export const initUser = (params: { uid: string; idToken: string }) => {
  return fetch(`${API_BASE_URL}/api/users/${params.uid}/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.idToken}`,
    },
  });
};

export const getProductsByDownloadCode = async (
  codes: string[]
): Promise<{
  [code: string]: { product: IProduct; downloadCode: IDownloadCode };
}> => {
  const query = `?codes=${codes.join(",")}`;
  const res = await fetch(`${API_BASE_URL}/api/products/activated${query}`);
  if (!res.ok) {
    return {};
  }

  const dto: ActivatedProductsDto = await res.json();

  const result: {
    [code: string]: { product: IProduct; downloadCode: IDownloadCode };
  } = {};

  for (const code of Object.keys(dto)) {
    const verifyResult = dto[code];
    if (!verifyResult) {
      break;
    }
    const { product, downloadCode } = verifyResult;
    result[code] = {
      product: {
        id: product.id,
        name: product.name,
        iconDownloadUrl: product.iconDownloadUrl,
        description: product.description,
        productFiles: Object.fromEntries(
          Object.entries(product.productFiles).map(([id, productFile]) => {
            const expiresParams = new URL(
              productFile.signedDownloadUrl
            ).searchParams.get("Expires");
            const expireDate = expiresParams
              ? new Date(parseInt(expiresParams) * 1000)
              : new Date();

            return [
              id,
              {
                displayName: productFile.displayName,
                signedDownloadUrl: {
                  value: productFile.signedDownloadUrl,
                  expireDate,
                },
                size: productFile.size,
                contentType: productFile.contentType,
                originalName: productFile.originalName,
                index: productFile.index,
              },
            ] as const;
          })
        ),
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
  }
  return result;
};

export const sendImpression = (params: {
  uid: string;
  productId: string;
  text: string;
  idToken?: string;
}): Promise<any> => {
  return fetch(`${API_BASE_URL}/api/users/${params.uid}/impressions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.idToken
        ? {
            Authorization: `Bearer ${params.idToken}`,
          }
        : {}),
    },
    body: JSON.stringify({
      productId: params.productId,
      text: params.text,
    }),
  });
};

export const sendAuditLog = (
  params: Omit<AuditLogDocument, "createdAt">
): boolean => {
  // https://stackoverflow.com/a/31355857
  const data = new Blob([JSON.stringify(params)], {
    type: "application/json",
  });
  return navigator.sendBeacon(`${API_BASE_URL}/api/audit-logs`, data);
};
