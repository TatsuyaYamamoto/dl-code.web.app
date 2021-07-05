import { Module } from "@nestjs/common";

import { UserController } from "./controller/user.controller";
import { ProductController } from "./controller/product.controller";
import { AuditLogController } from "./controller/audit-log.controller";

import { UserService } from "./services/user.service";
import { DownloadCodeService } from "./services/download-code.service";
import { AuditLogService } from "./services/audit-log.service";

@Module({
  controllers: [UserController, ProductController, AuditLogController],
  providers: [UserService, DownloadCodeService, AuditLogService],
})
export class AppModule {}
