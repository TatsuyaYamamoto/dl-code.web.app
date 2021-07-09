import { storage } from "firebase-admin";
import { logger } from "firebase-functions";
import type { EventContext } from "firebase-functions/lib/cloud-functions";

import { backupFirestoreData } from "../../utils/gcp";

// TODO: 保存期間の方針を検討してちょうだい
const MAX_BACKUP_DATE_LENGTH = 30;

const scheduledFirestoreBackup = async (context: EventContext) => {
  logger.log("run firebase scheduled job.", context);

  // Backup済みのファイルをカウントして、`MAX_BACKUP_DATE_LENGTH`を超過した分を削除する
  // 先に削除してからexportを実行しているのは、export後にBucket#getFilesを実行すると、直前のexportされたFileが含まれないため

  // implement `[backupFiles]` according to document, but don't know why
  // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/Bucket#getFiles
  const [backupFiles] = await storage().bucket().getFiles({
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
};

export default scheduledFirestoreBackup;
