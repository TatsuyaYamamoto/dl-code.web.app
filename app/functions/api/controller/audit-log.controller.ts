import { Controller, Body, Post, HttpCode } from "@nestjs/common";

import { AuditLogService } from "../services/audit-log.service";
import { AuditLogForm } from "./form/AuditLogForm";

@Controller("audit-logs")
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Post()
  @HttpCode(204)
  async add(@Body() body: AuditLogForm): Promise<any> {
    await this.auditLogService.add(body);
    return;
  }
}
