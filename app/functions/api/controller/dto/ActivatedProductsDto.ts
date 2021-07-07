import type {
  ProductFileDisplayName,
  ProductFileOriginalName,
} from "../../../../domains/Product";

interface Product {
  id: string;
  name: string;
  description: string;
  productFiles: {
    [id: string]: {
      displayName: ProductFileDisplayName;
      storageUrl: string;
      size: number;
      contentType: string;
      originalName: ProductFileOriginalName;
      index: number;
    };
  };
  ownerUid: string;
  iconDownloadUrl: string | null;
  createdAt: string;
}

interface DownloadCode {
  downloadCodeSetId: string;
  description: string | null;
  productId: string;
  createdAt: string;
  expiredAt: string;
}

export type ActivatedProductsDto = {
  [code: string]:
    | {
        product: Product;
        downloadCode: DownloadCode;
      }
    | undefined;
};
