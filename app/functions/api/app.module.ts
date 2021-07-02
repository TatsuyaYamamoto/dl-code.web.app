import { Module } from "@nestjs/common";

import { UserController } from "./controller/user.controller";
import { DownloadCodeController } from "./controller/download-code.controller";

import { UserService } from "./services/user.service";
import { DownloadCodeService } from "./services/download-code.service";

@Module({
  controllers: [UserController, DownloadCodeController],
  providers: [UserService, DownloadCodeService],
})
export class AppModule {}
