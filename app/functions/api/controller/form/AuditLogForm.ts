import { LogType } from "../../../../domains/AuditLog";

export class AuditLogForm {
  // who
  userId?: string;
  // what
  type?: LogType;
  // when
  // createdAt: DateType;
  // where
  href?: string;
  userAgent?: string;
  // how
  params?: any;
  // results
  ok?: boolean;
  fatal?: boolean;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}
