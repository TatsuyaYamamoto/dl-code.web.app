import firebase from "firebase/app";
import { firestore as adminFirestoreType } from "firebase-admin";

type Timestamp = firebase.firestore.Timestamp;

export type AuditLogColRef<DateType> = firebase.firestore.CollectionReference<
  AuditLogDocument<DateType>
>;

export enum LogType {
  ACTIVATE_WITH_DOWNLOAD_CODE = "ACTIVATE_WITH_DOWNLOAD_CODE",
  DOWNLOAD_PRODUCT_FILE = "DOWNLOAD_PRODUCT_FILE",
  PLAY_PRODUCT_FILE = "PLAY_PRODUCT_FILE",
  EXCEPTION = "EXCEPTION",
  EXCEPTION_FAIL_DOWNLOAD_FILE = "EXCEPTION_FAIL_TO_DOWNLOAD_FILE",
  EXCEPTION_FILE_TO_PLAY_AUDIO = "EXCEPTION_FILE_TO_PLAY_AUDIO",
}

export interface AuditLogDocument<DateType = Timestamp> {
  // who
  userId:
    | string // login user
    | null; // non-login user (ex. download only)

  // what
  type: LogType;

  // when
  createdAt: DateType;

  // where
  href: string;
  userAgent: string;

  // how
  params: any;

  // results
  ok: boolean;

  // error
  fatal?: boolean;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export const getColRef = <DateType = Timestamp>(
  firestoreInstance:
    | firebase.firestore.Firestore
    | adminFirestoreType.Firestore = firebase.firestore()
) => {
  return firestoreInstance.collection(`auditLogs`) as AuditLogColRef<DateType>;
};
