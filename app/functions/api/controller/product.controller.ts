import { Controller, Query, Get, BadRequestException } from "@nestjs/common";

import { ActivatedProductsDto } from "./dto/ActivatedProductsDto";
import { DownloadCodeService } from "../services/download-code.service";

import { getUnsignedDownloadUrl } from "../../utils/firebase";

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

    const dto: ActivatedProductsDto = {};
    await Promise.all(
      codes.map(async (code) => {
        dto[code] = await this.verify(code);
      })
    );

    return dto;
  }

  private verify = async (code: string) => {
    const verifyResult = await this.downloadCodeService.verify(code);
    if (!verifyResult) {
      return undefined;
    }

    const { productId, product, downloadCodeSetId, downloadCode } =
      verifyResult;
    const iconUrl = product.iconStorageUrl
      ? await getUnsignedDownloadUrl(product.iconStorageUrl)
      : null;

    return {
      product: {
        id: productId,
        name: product.name,
        description: product.description,
        productFiles: product.productFiles,
        ownerUid: product.ownerUid,
        iconDownloadUrl: iconUrl,
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
