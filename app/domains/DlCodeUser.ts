import firebase from "firebase/app";
import type { firestore as adminFirestoreType } from "firebase-admin";

export type Timestamp = firebase.firestore.Timestamp;
export type FirebaseUser = firebase.User;
export type DlCodeUserColRef<DateType> = firebase.firestore.CollectionReference<
  DlCodeUserDocument<DateType>
>;

export interface Counter {
  limit: number;
  current: number;
}

export type CounterType = "product" | "downloadCode" | "totalFileSizeByte";

export interface DlCodeUserDocument<DateType = Timestamp> {
  counters: { [type in CounterType]: Counter };
  createdAt: DateType;
  updatedAt: DateType;
}

export const getColRef = <DateType = Timestamp>(
  firestoreInstance:
    | firebase.firestore.Firestore
    | adminFirestoreType.Firestore = firebase.firestore()
) => {
  return firestoreInstance.collection(`users`) as DlCodeUserColRef<DateType>;
};

export const editCounter = async (
  user: {
    uid: string;
    counters: { [type in CounterType]: Counter };
  },
  counter: CounterType,
  newValue: number,
  firestoreInstance: firebase.firestore.Firestore
) => {
  const { limit } = user.counters[counter];

  if (limit < newValue) {
    throw new Error(`Exceeded limit. limit: ${limit}, new : ${newValue}`);
  }

  const colRef = DlCodeUser.getColRef(firestoreInstance);

  // (100%ではないが)型安全にネストされたオブジェクトのkeyを宣言する
  const keyElements: (
    | keyof DlCodeUserDocument
    | CounterType
    | keyof Counter
  )[] = ["counters", counter, "current"];
  const nestedUpdateObjectKey = keyElements.join(".");

  return colRef.doc(user.uid).update({
    [nestedUpdateObjectKey]: newValue,
  });
};

export class DlCodeUser {
  public constructor(
    readonly user: DlCodeUserDocument,
    readonly firebaseUser: FirebaseUser
  ) {}

  public get uid(): string {
    return this.firebaseUser.uid;
  }

  /**
   * twitter api上のscreen_nameを返却する
   */
  public get displayName(): string {
    const displayName = this.firebaseUser.displayName;

    if (!displayName) {
      // TODO Twitterアカウントに表示名がない想定は無いが、デフォルト文字列を返却するようにする
      return "";
    }

    return displayName;
  }

  public get iconUrl(): string {
    const url = this.firebaseUser.photoURL;

    if (!url) {
      // TODO Twitterアカウントにアイコンがない想定は無いが、デフォルト画像のURLを返却するようにする
      return "";
    }

    // https://developer.twitter.com/en/docs/accounts-and-users/user-profile-images-and-banners
    return url.replace("normal", "bigger");
  }

  public async editCounter(
    counter: CounterType,
    newValue: number,
    firestoreInstance: firebase.firestore.Firestore
  ) {
    const { limit } = this.user.counters[counter];

    if (limit < newValue) {
      throw new Error(`Exceeded limit. limit: ${limit}, new : ${newValue}`);
    }

    const colRef = DlCodeUser.getColRef(firestoreInstance);

    // (100%ではないが)型安全にネストされたオブジェクトのkeyを宣言する
    const keyElements: (
      | keyof DlCodeUserDocument
      | CounterType
      | keyof Counter
    )[] = ["counters", counter, "current"];
    const nestedUpdateObjectKey = keyElements.join(".");

    return colRef.doc(this.uid).update({
      [nestedUpdateObjectKey]: newValue,
    });
  }

  public static getColRef(firestoreInstance: firebase.firestore.Firestore) {
    return firestoreInstance.collection(`users`);
  }
}
