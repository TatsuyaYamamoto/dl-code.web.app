import { Controller, Body, Put } from "@nestjs/common";

import { DownloadCodeService } from "../services/download-code.service";
import { VerifyForm } from "./form/VerifyForm";
import { VerifyResult } from "./dto/VerifyResult";

@Controller("download-code")
export class DownloadCodeController {
  constructor(private downloadCodeService: DownloadCodeService) {}

  @Put("verify")
  async verify(@Body() body: VerifyForm): Promise<VerifyResult> {
    const data = await this.downloadCodeService.verify(body.downloadCode);

    return {
      valid: !!data,
      data: data && {
        productId: data.productId,
        expiredAt: data.expiredAt.toISOString(),
      },
    };
  }
}
