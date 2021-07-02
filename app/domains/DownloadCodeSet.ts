import firebase from "firebase/app";
import * as base32 from "hi-base32";
import type { firestore as adminFirestoreType } from "firebase-admin";

type DocumentReference = firebase.firestore.DocumentReference;
export type DownloadCodeSetColRef<DateType> =
  firebase.firestore.CollectionReference<DownloadCodeSetDocument<DateType>>;
type Timestamp = firebase.firestore.Timestamp;

export interface DownloadCodeSetDocument<DateType = Timestamp> {
  productRef: DocumentReference;
  // TODO: check permission to handle code resources
  codes: {
    [value: string]: boolean;
  };
  description: string | null;
  createdAt: DateType;
  expiredAt: DateType;
}

export const getColRef = <DateType = Timestamp>(
  firestoreInstance:
    | firebase.firestore.Firestore
    | adminFirestoreType.Firestore = firebase.firestore()
) => {
  return firestoreInstance.collection(
    `downloadCodeSets`
  ) as DownloadCodeSetColRef<DateType>;
};

/**
 * @deprecated
 */
export class DownloadCodeSet implements DownloadCodeSetDocument<Date> {
  // TODO: remove dependency of firestore instance.
  public static getColRef() {
    return firebase.firestore().collection(`downloadCodeSets`);
  }

  public static getDocRef(id: string) {
    return getColRef().doc(id);
  }

  public static watchListByProductRef(
    ref: DocumentReference,
    callback: (downloadCodeSets: DownloadCodeSet[]) => void
  ): () => void {
    const query = DownloadCodeSet.getColRef().where("productRef", "==", ref);

    return query.onSnapshot((querySnap) => {
      const downloadCodeSets = querySnap.docs.map((snap) => {
        const id = snap.id;
        const data = snap.data({
          serverTimestamps: "estimate",
        }) as DownloadCodeSetDocument;

        return new DownloadCodeSet(
          id,
          data.productRef,
          data.codes,
          data.description,
          data.createdAt.toDate(),
          data.expiredAt.toDate()
        );
      });

      callback(downloadCodeSets);
    });
  }

  /**
   *
   * @param productRef
   * @param numberOfCodes
   * @param expiredAt
   * TODO 最大作成数は100ぐらい？
   */
  public static async create(
    productRef: DocumentReference,
    numberOfCodes: number,
    expiredAt: Date
  ) {
    const newCodes: {
      [code: string]: boolean;
    } = {};

    [...Array(numberOfCodes)].forEach(() => {
      const code = DownloadCodeSet.generateCode();
      newCodes[code] = true;
    });

    const now = new Date();

    const newSetDocDate: DownloadCodeSetDocument<Date> = {
      productRef,
      codes: newCodes,
      createdAt: now,
      description: null,
      expiredAt,
    };
    await getColRef<Date>().add(newSetDocDate);
  }

  /**
   * ActivationCodeの文字列を生成する
   *
   * @link https://tools.ietf.org/html/rfc4648#section-6
   * @link https://quesqa.com/random-string-collision-prob/
   * @link https://yu-kimura.jp/2018/03/21/base32/
   * @link https://qiita.com/janus_wel/items/40a62afb7dc103fbcd8a
   */
  public static generateCode(): string {
    const chars = Array(5)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16));

    return base32.encode(chars.join(""));
  }

  public constructor(
    // metadata
    readonly id: string,
    // fields
    readonly productRef: DocumentReference,
    readonly codes: {
      [value: string]: boolean;
    },
    readonly description: string | null,
    readonly createdAt: Date,
    readonly expiredAt: Date
  ) {}

  public get ref() {
    return DownloadCodeSet.getDocRef(this.id);
  }
}
