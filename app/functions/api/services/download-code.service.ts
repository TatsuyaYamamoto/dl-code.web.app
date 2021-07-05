import * as firebaseAdmin from "firebase-admin";
import { Injectable } from "@nestjs/common";

import {
  DownloadCodeSetDocument,
  getColRef as getDownloadCodeSetsColRef,
} from "../../../domains/DownloadCodeSet";
import { ProductDocument } from "../../../domains/Product";

@Injectable()
export class DownloadCodeService {
  async verify(downloadCode: string): Promise<
    | {
        downloadCodeSetId: string;
        downloadCode: DownloadCodeSetDocument;
        productId: string;
        product: ProductDocument;
      }
    | undefined
  > {
    const downloadCodeSetsSnap = await getDownloadCodeSetsColRef(
      firebaseAdmin.firestore()
    )
      .where(`codes.${downloadCode}`, "==", true)
      .get();

    if (downloadCodeSetsSnap.empty) {
      return;
    }

    const downloadCodeDoc = downloadCodeSetsSnap.docs[0].data();
    const productSnap = await downloadCodeDoc.productRef.get();
    const productDoc = productSnap.data() as ProductDocument | undefined;

    if (!productDoc) {
      throw new Error(
        "unexpected error. there is no product related to download code"
      );
    }

    return {
      downloadCodeSetId: downloadCodeSetsSnap.docs[0].id,
      downloadCode: downloadCodeDoc,
      productId: productSnap.id,
      product: productDoc,
    };
  }
}
