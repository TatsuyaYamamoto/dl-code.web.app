import firebase from "firebase/app";

import { AuditLogDocument, LogType } from "../../domains/AuditLog";
import { sendAuditLog } from "../../utils/api";

const useAuditLogger = () => {
  const log = async <E extends Error>(
    type: LogType,
    params: any,
    ok: boolean,
    error?: E,
    fatal?: boolean
  ) => {
    const { currentUser } = firebase.auth();
    const newLog: Omit<AuditLogDocument, "createdAt"> = {
      userId: currentUser ? currentUser.uid : null,
      type,
      params,
      ok,
      href: window.location.href,
      userAgent: navigator.userAgent,
      error: error
        ? {
            ...error,
            stack: error?.stack || null,
          }
        : undefined,
      fatal,
    };

    await sendAuditLog(newLog);
  };

  interface OkAuditData {
    type: LogType;
    params: any;
  }

  const okAudit = (data: OkAuditData) => {
    return log(data.type, data.params, true);
  };

  interface ErrorAuditData<E extends Error = Error> {
    type: LogType;
    params: any;
    error: E;
    fatal?: boolean;
  }

  const errorAudit = (data: ErrorAuditData) => {
    const { type, params, error, fatal } = data;
    return log(type, params, false, error, fatal);
  };

  return { okAudit, errorAudit };
};

export default useAuditLogger;
