import * as firebaseAdmin from "firebase-admin";
import { Injectable } from "@nestjs/common";

import { getColRef as getDownloadCodeSetsColRef } from "../../../domains/DownloadCodeSet";

@Injectable()
export class DownloadCodeService {
  async verify(
    downloadCode: string
  ): Promise<{ productId: string; expiredAt: Date } | undefined> {
    const snap = await getDownloadCodeSetsColRef(firebaseAdmin.firestore())
      .where(`codes.${downloadCode}`, "==", true)
      .get();

    if (snap.empty) {
      return;
    }

    const doc = snap.docs[0].data();

    return {
      productId: doc.productRef.id,
      expiredAt: doc.expiredAt.toDate(),
    };
  }
}
