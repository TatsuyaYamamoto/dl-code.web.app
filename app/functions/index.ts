import * as functions from "firebase-functions";
import { logger } from "firebase-functions";
import * as firebaseAdmin from "firebase-admin";

// Initial Firebase App
const firebaseApp = firebaseAdmin.initializeApp();
firebaseApp.firestore().settings({
  ignoreUndefinedProperties: true,
});

/* eslint-disable import/first */
import { getExpressInstance } from "./api";
import { backupFirestoreData } from "../utils/gcp";
import { sendToSlack } from "./utils/slack";

// TODO: 保存期間の方針を検討してちょうだい
const MAX_BACKUP_DATE_LENGTH = 30;

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
  .onRun(async (context) => {
    logger.log("run firebase scheduled job.", context);

    // Backup済みのファイルをカウントして、`MAX_BACKUP_DATE_LENGTH`を超過した分を削除する
    // 先に削除してからexportを実行しているのは、export後にBucket#getFilesを実行すると、直前のexportされたFileが含まれないため

    // implement `[backupFiles]` according to document, but don't know why
    // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/Bucket#getFiles
    const [backupFiles] = await firebaseApp.storage().bucket().getFiles({
      prefix: "backups",
    });

    const backupDates = backupFiles
      // extract backup date string
      .map((file) => {
        return file.name.split("/")[1];
      })
      // remove duplicates
      .filter((value, index, self) => {
        return self.indexOf(value) === index;
      })
      // sort by date
      .sort()
      // make desc
      .reverse();

    logger.log(`dates backed-up: ${backupDates}`);

    const deleteDates = backupDates.slice(MAX_BACKUP_DATE_LENGTH);
    logger.log(`dates to be deleted: ${deleteDates}`);

    const deleteFilePromises: Promise<any>[] = [];
    const deleteFileKeys: string[] = [];

    // 無駄なループを回す実装だが、`deleteDates`は基本的にlength===1を想定しているので、良しとする
    for (const deleteDate of deleteDates) {
      for (const backupFile of backupFiles) {
        if (!backupFile.name.startsWith(`backups/${deleteDate}`)) {
          continue;
        }

        deleteFileKeys.push(backupFile.name);
        deleteFilePromises.push(backupFile.delete());
      }
    }

    await Promise.all(deleteFilePromises);

    logger.log(
      `success to delete ${deleteFileKeys.length} backup date files.`,
      deleteFileKeys
    );

    try {
      const result = await backupFirestoreData();
      logger.log("success to backup-export.", result);
    } catch (error) {
      logger.error("fail to backup-export.", error);
    }
  });

export const cloudFunctionsErrorLog = functions.pubsub
  .topic("cloud-functions-error-log")
  .onPublish(async (message, context) => {
    try {
      const data = JSON.parse(new Buffer(message.data, "base64").toString());
      const { function_name, project_id } = data.resource.labels;
      const executionId = context.eventId;

      const logUrl =
        `https://logger.cloud.google.com/logs/viewer` +
        `?project=${project_id}` +
        `&advancedFilter=labels."execution_id"%3D"${executionId}"`;

      const title = `Catch unhandled error! *${function_name}* <${logUrl}|Open log>`;
      const text = JSON.stringify(data, null, "\t");
      const result = await sendToSlack({
        title,
        text,
        color: "danger",
      });

      logger.log(
        `it's success to send slack message. slack text: ${result.text}, pubsub message: ${message}, context: ${context}`
      );
    } catch (e) {
      logger.info("FATAL ERROR! Could not send slack webhook!", e);
    }
  });
