import firebase from "firebase/app";
import { ProductDocRef } from "./Product";
import { firestore as adminFirestoreType } from "firebase-admin";

export type ImpressionDocRef<DateType = Timestamp> =
  firebase.firestore.DocumentReference<ImpressionDocument<DateType>>;
export type ImpressionColRef<DateType> = firebase.firestore.CollectionReference<
  ImpressionDocument<DateType>
>;
type Timestamp = firebase.firestore.Timestamp;

export interface ImpressionDocument<DateType = Timestamp> {
  uid: string | "anonymous";
  productRef: ProductDocRef<DateType>;
  text: string;
  createdAt: DateType;
}

export const getColRef = <DateType = Timestamp>(
  firestoreInstance:
    | firebase.firestore.Firestore
    | adminFirestoreType.Firestore = firebase.firestore()
) => {
  return firestoreInstance.collection(
    `impressions`
  ) as ImpressionColRef<DateType>;
};
