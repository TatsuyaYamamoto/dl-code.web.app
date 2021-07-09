import * as functions from "firebase-functions";
import * as firebaseAdmin from "firebase-admin";

// Initial Firebase App
const firebaseApp = firebaseAdmin.initializeApp();
firebaseApp.firestore().settings({
  ignoreUndefinedProperties: true,
});

/* eslint-disable import/first */
import { getExpressInstance } from "./api";
import _scheduledFirestoreBackup from "./pubsub/scheduledFirestoreBackup";
import _cloudFunctionsErrorLog from "./pubsub/cloudFunctionsErrorLog";

export const api = functions
  .region("asia-northeast1")
  .https.onRequest(async (...args) => {
    const server = await getExpressInstance();
    server(...args);
  });

/**
 * FirestoreのバックアップをstorageにexportするScheduledJob
 * 日本時間のAM09:00に実行される
 */
export const scheduledFirestoreBackup = functions
  .region("asia-northeast1")
  .pubsub.schedule("00 09 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(_scheduledFirestoreBackup);

export const cloudFunctionsErrorLog = functions.pubsub
  .topic("cloud-functions-error-log")
  .onPublish(_cloudFunctionsErrorLog);
