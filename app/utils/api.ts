import configs from "../configs";
import type { VerifyResult } from "../functions/api/controller/dto/VerifyResult";

export const initUser = (params: { uid: string; idToken: string }) => {
  return fetch(`${configs.apiBaseUrl}/api/users/${params.uid}/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.idToken}`,
    },
  });
};

export const verifyDownloadCode = (params: {
  downloadCode: string;
}): Promise<
  | { valid: false }
  | {
      valid: true;
      data: {
        productId: string;
        expiredAt: Date;
      };
    }
> => {
  return fetch(`${configs.apiBaseUrl}/api/download-code/verify`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      downloadCode: params.downloadCode,
    }),
  })
    .then((res) => res.json())
    .then((result: VerifyResult) => {
      if (!result.valid || !result.data) {
        return {
          valid: false,
        };
      }

      return {
        valid: true,
        data: {
          productId: result.data.productId,
          expiredAt: new Date(result.data.expiredAt),
        },
      };
    });
};
