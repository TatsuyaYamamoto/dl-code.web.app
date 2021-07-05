import { Controller, Query, Get, BadRequestException } from "@nestjs/common";

import { DownloadCodeService } from "../services/download-code.service";
import { ActivatedProductsDto } from "./dto/ActivatedProductsDto";

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

    const verifyResults = await Promise.all(
      codes.map(async (code) => {
        const verifyResult = await this.downloadCodeService.verify(code);
        return {
          code,
          verifyResult,
        };
      })
    );

    const dto: ActivatedProductsDto = {};
    verifyResults.forEach(({ code, verifyResult }) => {
      if (!verifyResult) {
        dto[code] = undefined;
        return;
      }

      dto[code] = {
        product: {
          id: verifyResult.productId,
          name: verifyResult.product.name,
          description: verifyResult.product.description,
          productFiles: verifyResult.product.productFiles,
          ownerUid: verifyResult.product.ownerUid,
          iconStorageUrl: verifyResult.product.iconStorageUrl,
          createdAt: verifyResult.product.createdAt.toDate().toISOString(),
        },
        downloadCode: {
          downloadCodeSetId: verifyResult.downloadCodeSetId,
          productId: verifyResult.downloadCode.productRef.id,
          description: verifyResult.downloadCode.description,
          createdAt: verifyResult.downloadCode.createdAt.toDate().toISOString(),
          expiredAt: verifyResult.downloadCode.expiredAt.toDate().toISOString(),
        },
      };
    });

    return dto;
  }
}
