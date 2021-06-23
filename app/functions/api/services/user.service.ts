import { logger } from "firebase-functions";
import * as firebaseAdmin from "firebase-admin";
import { Injectable } from "@nestjs/common";

import type { DlCodeUserDocument } from "../../../domains/DlCodeUser";

@Injectable()
export class UserService {
  async init(uid: string): Promise<DlCodeUserDocument | null> {
    const newUserDoc: DlCodeUserDocument = {
      counters: {
        product: {
          limit: 1,
          current: 0,
        },
        downloadCode: {
          limit: 100,
          current: 0,
        },
        totalFileSizeByte: {
          limit: 1 * 1000 * 1000 * 1000, // 1GB
          current: 0,
        },
      },
    };
    const newUserDocRef = firebaseAdmin
      .firestore()
      .collection("users")
      .doc(uid);

    const newUserSnap = await newUserDocRef.get();
    if (newUserSnap.exists) {
      logger.error(`user is already registered. uid: ${uid}`);
      return null;
    }

    await newUserDocRef.set(newUserDoc);
    logger.error(`new user is inited.`, newUserDoc);
    return newUserDoc;
  }
}
