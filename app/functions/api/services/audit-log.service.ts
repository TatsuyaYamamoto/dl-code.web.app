import * as firebaseAdmin from "firebase-admin";
import { logger } from "firebase-functions";
import { Injectable } from "@nestjs/common";

import {
  AuditLogDocument,
  getColRef as getAuditLogColRef,
  LogType,
} from "../../../domains/AuditLog";
import { AuditLogForm } from "../controller/form/AuditLogForm";

type FieldValue = firebaseAdmin.firestore.FieldValue;

@Injectable()
export class AuditLogService {
  async add(form: AuditLogForm): Promise<void> {
    const userId = form.userId || null;
    const type = form.type || LogType.EXCEPTION;
    const params = form.params || {};
    const createdAt = firebaseAdmin.firestore.FieldValue.serverTimestamp();
    const href = form.href || "";
    const userAgent = form.userAgent || "";
    const ok = form.ok || false;

    // undefined-able
    const fatal = form.fatal;
    const error = form.error;

    const newLog: AuditLogDocument<FieldValue> = {
      userId,
      userAgent,
      type,
      params,
      createdAt,
      href,
      ok,
      fatal,
      error,
    };

    const logRef = await getAuditLogColRef<FieldValue>(
      firebaseAdmin.firestore()
    ).add(newLog);
    const newLogRefId = logRef.id;
    logger.log("write auditLog successfully.", newLogRefId);

    // validation and notification
    if (fatal) {
      // notify
    }
    // TODO
  }
}
