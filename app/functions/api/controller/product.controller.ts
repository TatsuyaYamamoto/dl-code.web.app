import { Controller, Query, Get, BadRequestException } from "@nestjs/common";
import { addHours } from "date-fns";

import { ActivatedProductsDto } from "./dto/ActivatedProductsDto";
import { DownloadCodeService } from "../services/download-code.service";
import {
  getUnsignedDownloadUrl,
  getSignedDownloadUrl,
} from "../../utils/firebase";
import { DownloadCodeSetDocument } from "../../../domains/DownloadCodeSet";
import { ProductDocument } from "../../../domains/Product";

const PRODUCT_FILE_URL_VALIDITY_PERIOD_HOURS = 24;

@Controller("products")
export class ProductController {
  constructor(private downloadCodeService: DownloadCodeService) {}

  @Get("activated")
  async list(
    @Query("codes") queryCodes?: string | string[]
  ): Promise<ActivatedProductsDto> {
    if (!queryCodes) {
      throw new BadRequestException();
    }

    const codes = (
      Array.isArray(queryCodes) ? queryCodes[0] : queryCodes
    ).split(",");

    const fileUrlExpireDate = addHours(
      new Date(),
      PRODUCT_FILE_URL_VALIDITY_PERIOD_HOURS
    );
    const multipleVerifyPromise = codes.map(async (code) => {
      const verifyResult = await this.downloadCodeService.verify(code);
      if (!verifyResult) {
        return [code, undefined] as const;
      }

      const value = await this.verifyResultToDtoPart(
        verifyResult,
        fileUrlExpireDate
      );
      return [code, value] as const;
    });

    return Object.fromEntries(await Promise.all(multipleVerifyPromise));
  }

  private verifyResultToDtoPart = async (
    verifyResult: {
      productId: string;
      product: ProductDocument;
      downloadCodeSetId: string;
      downloadCode: DownloadCodeSetDocument;
    },
    fileUrlExpireDate: Date
  ) => {
    const { productId, product, downloadCodeSetId, downloadCode } =
      verifyResult;
    const iconDownloadUrl = product.iconStorageUrl
      ? await getUnsignedDownloadUrl(product.iconStorageUrl)
      : null;

    const productFileEntriesPromise = Object.entries(product.productFiles).map(
      async ([id, productFile]) => {
        const { storageUrl, ...others } = productFile;
        const val = {
          ...others,
          signedDownloadUrl: await getSignedDownloadUrl(
            productFile.storageUrl,
            fileUrlExpireDate
          ),
        };
        return [id, val] as const;
      }
    );

    const productFiles = Object.fromEntries(
      await Promise.all(productFileEntriesPromise)
    );

    return {
      product: {
        id: productId,
        name: product.name,
        description: product.description,
        productFiles,
        ownerUid: product.ownerUid,
        iconDownloadUrl,
        createdAt: product.createdAt.toDate().toISOString(),
      },
      downloadCode: {
        downloadCodeSetId: downloadCodeSetId,
        productId: downloadCode.productRef.id,
        description: downloadCode.description,
        createdAt: downloadCode.createdAt.toDate().toISOString(),
        expiredAt: downloadCode.expiredAt.toDate().toISOString(),
      },
    };
  };
}
