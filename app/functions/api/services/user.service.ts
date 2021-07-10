import { logger } from "firebase-functions";
import * as firebaseAdmin from "firebase-admin";
import { Injectable } from "@nestjs/common";

import type { DlCodeUserDocument } from "../../../domains/DlCodeUser";
import { getColRef as getProductColRef } from "../../../domains/Product";
import {
  getColRef as getImpressionColRef,
  ImpressionDocRef,
  ImpressionDocument,
} from "../../../domains/Impression";

type FieldValue = firebaseAdmin.firestore.FieldValue;

@Injectable()
export class UserService {
  async init(uid: string): Promise<DlCodeUserDocument | null> {
    const newUserDoc: DlCodeUserDocument<FieldValue> = {
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
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
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
    logger.log(`new user is inited.`, newUserDoc);
    return newUserDoc as DlCodeUserDocument;
  }

  public async saveImpression(
    uid: string,
    productId: string,
    text: string
  ): Promise<ImpressionDocRef> {
    const productRef = getProductColRef(firebaseAdmin.firestore()).doc(
      productId
    );
    const newImpression: ImpressionDocument<FieldValue> = {
      uid,
      productRef,
      text,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    };

    return (await getImpressionColRef<FieldValue>(
      firebaseAdmin.firestore()
    ).add(newImpression)) as ImpressionDocRef;
  }
}
