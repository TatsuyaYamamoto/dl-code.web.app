import firebase from "firebase/app";
import { v4 as uuid } from "uuid";
import { firestore as adminFirestoreType } from "firebase-admin";

type Firestore = firebase.firestore.Firestore;
export type ProductDocRef<DateType = Timestamp> =
  firebase.firestore.DocumentReference<ProductDocument<DateType>>;
export type ProductColRef<DateType> = firebase.firestore.CollectionReference<
  ProductDocument<DateType>
>;
type Timestamp = firebase.firestore.Timestamp;
type UpdateData = firebase.firestore.UpdateData;
type FieldValue = firebase.firestore.FieldValue;
type UploadTask = firebase.storage.UploadTask;

// NominalTypings
// @link https://basarat.gitbooks.io/typescript/docs/tips/nominalTyping.html
export type ProductName = string & {
  _productNameBrand: never;
};

export type ProductDescription = string & {
  _productDescriptionBrand: never;
};

export type ProductFileDisplayName = string & {
  _productFileDisplayNameBrand: never;
};

export type ProductFileOriginalName = string & {
  _productFileOriginalName: never;
};

export interface ProductFile {
  /**
   * 一覧に表示する時にしようするファイル名
   */
  displayName: ProductFileDisplayName;
  /**
   * @see storage#Reference#toString()
   */
  storageUrl: string;

  /**
   * ファイルサイズ[byte]
   */
  size: number;

  /**
   * @link storage#SettableMetadata#contentType
   */
  contentType: string;

  /**
   * アップロードされたときのファイル名
   */
  originalName: ProductFileOriginalName;

  /**
   * リスト表示時の並び順
   */
  index: number;
}

export interface ProductFileMap {
  [id: string]: ProductFile;
}

export interface ProductDocument<DateType = Timestamp> {
  name: ProductName;
  /**
   * @see storage#Reference#toString()
   */
  iconStorageUrl: string | null;
  description: ProductDescription;
  productFiles: ProductFileMap;
  ownerUid: string;
  createdAt: DateType;
}

export const getColRef = <DateType = Timestamp>(
  firestoreInstance:
    | firebase.firestore.Firestore
    | adminFirestoreType.Firestore = firebase.firestore()
) => {
  return firestoreInstance.collection(`products`) as ProductColRef<DateType>;
};

export interface IProductFile {
  displayName: string;
  signedDownloadUrl: {
    value: string;
    expireDate: Date;
  };
  size: number;
  contentType: string;
  originalName: string;
  index: number;
}

export interface IProduct {
  readonly id: string;
  readonly name: string;
  readonly iconDownloadUrl: string | null;
  readonly description: string;
  readonly ownerUid: string;
  readonly productFiles: { [id: string]: IProductFile };
  readonly createdAt: Date;
}

/**
 * @deprecated
 */
export class Product implements ProductDocument<Date> {
  public static getColRef(firestoreInstance: Firestore) {
    return firestoreInstance.collection(`products`);
  }

  public static getDocRef(id: string, firestoreInstance: Firestore) {
    return Product.getColRef(firestoreInstance).doc(id);
  }

  public static getProductFileStorageRef(uid: string, productId: string) {
    return firebase.storage().ref(`users/${uid}/products/${productId}/files`);
  }

  public static getImageStorageRef(uid: string, productId: string) {
    return firebase.storage().ref(`users/${uid}/products/${productId}/images`);
  }

  public static watchOne(
    productId: string,
    firestoreInstance: Firestore,
    callback: (product: Product | null) => void
  ): () => void {
    const query = Product.getColRef(firestoreInstance).doc(productId);

    return query.onSnapshot((querySnap) => {
      if (!querySnap.exists) {
        callback(null);
        return;
      }

      const {
        name,
        iconStorageUrl,
        description,
        ownerUid,
        productFiles,
        createdAt,
      } = querySnap.data({ serverTimestamps: "estimate" }) as ProductDocument;

      callback(
        new Product(
          querySnap.id,
          name,
          iconStorageUrl,
          description,
          ownerUid,
          productFiles,
          (createdAt as Timestamp).toDate(),
          firestoreInstance
        )
      );
    });
  }

  public static watchList(
    uid: string,
    firestoreInstance: Firestore,
    callback: (products: Product[]) => void
  ): () => void {
    const query = Product.getColRef(firestoreInstance).where(
      "ownerUid",
      "==",
      uid
    );

    return query.onSnapshot((querySnap) => {
      const products = querySnap.docs.map((docSnap) => {
        const {
          name,
          iconStorageUrl,
          description,
          ownerUid,
          productFiles,
          createdAt,
        } = docSnap.data({ serverTimestamps: "estimate" }) as ProductDocument;

        return new Product(
          docSnap.id,
          name,
          iconStorageUrl,
          description,
          ownerUid,
          productFiles,
          (createdAt as Timestamp).toDate(),
          firestoreInstance
        );
      });

      callback(products);
    });
  }

  public static async getById(
    id: string,
    firestoreInstance: Firestore
  ): Promise<Product | null> {
    const snap = await Product.getColRef(firestoreInstance).doc(id).get();

    if (!snap.exists) {
      return null;
    }
    const {
      name,
      iconStorageUrl,
      description,
      ownerUid,
      productFiles,
      createdAt,
    } = snap.data() as ProductDocument;

    return new Product(
      snap.id,
      name,
      iconStorageUrl,
      description,
      ownerUid,
      productFiles,
      (createdAt as Timestamp).toDate(),
      firestoreInstance
    );
  }

  public static async createNew(
    params: {
      name: ProductName;
      description: ProductDescription;
    },
    firestoreInstance: Firestore
  ): Promise<ProductDocRef | void> {
    const { name, description } = params;

    const owner = firebase.auth().currentUser;
    if (!owner) {
      return;
    }

    const newProductDoc: ProductDocument<FieldValue> = {
      name,
      iconStorageUrl: null,
      description,
      ownerUid: owner.uid,
      productFiles: {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    return (await getColRef<FieldValue>(firestoreInstance).add(
      newProductDoc
    )) as ProductDocRef;
  }

  public static async getCount(
    uid: string,
    firestoreInstance: Firestore
  ): Promise<number> {
    const querySnap = await Product.getColRef(firestoreInstance)
      .where("ownerUid", "==", uid)
      .get();

    return querySnap.size;
  }

  private cachedIconUrl: string | null = null;

  public constructor(
    // metadata
    readonly id: string,

    // document fields
    readonly name: ProductName,
    readonly iconStorageUrl: string | null,
    readonly description: ProductDescription,
    readonly ownerUid: string,
    readonly productFiles: { [id: string]: ProductFile },
    readonly createdAt: Date,

    // dependencies
    readonly firestoreInstance: Firestore
  ) {}

  public get ref() {
    return Product.getDocRef(this.id, this.firestoreInstance);
  }

  public get productFileCount(): number {
    return Object.keys(this.productFiles).length;
  }

  public addProductFile = (
    uid: string,
    displayName: ProductFileDisplayName,
    file: File
  ): { task: UploadTask; promise: Promise<void> } => {
    const originalFileName = file.name as ProductFileOriginalName;
    // @ts-ignore
    // TODO: handle file having no extension
    const extension = originalFileName.split(".").pop().toLowerCase();

    const fileId = Product.createNewFileName();

    const storageRef = Product.getProductFileStorageRef(uid, this.id).child(
      `${fileId}.${extension}`
    );

    const task = storageRef.put(file, {});
    const promise = new Promise<void>((resolve) => {
      task.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        () => {
          //
        },
        (e) => {
          // TODO
          // tslint:disable-next-line
          console.error(e);
        },
        async () => {
          const newProductFileId = Product.getAutoNewId();
          const currentProductFilesSize = Object.keys(this.productFiles).length;

          const newProductFile: ProductFile = {
            displayName,
            storageUrl: storageRef.toString(),
            size: file.size,
            contentType: file.type,
            originalName: originalFileName,
            index: currentProductFilesSize,
          };

          const partialNewDoc: Partial<ProductDocument> = {
            productFiles: {
              ...this.productFiles,
              [newProductFileId]: newProductFile,
            },
          };
          await this.ref.update(partialNewDoc);

          resolve();
        }
      );
    });

    return {
      task,
      promise,
    };
  };

  public deleteProductFile = async (deleteTargetId: string) => {
    const newProductFileMap: ProductFileMap = {};
    Object.keys(this.productFiles)
      // filter
      .filter((id) => {
        return id !== deleteTargetId;
      })
      // sort remaining elements
      .sort((aId, bId) => {
        const aIndex = this.productFiles[aId].index;
        const bIndex = this.productFiles[bId].index;

        return aIndex - bIndex;
      })
      // create new map
      .forEach((id, index) => {
        newProductFileMap[id] = {
          ...this.productFiles[id],
          index,
        };
      });

    const deleteDoc: Partial<ProductDocument> = {
      productFiles: newProductFileMap,
    };
    await this.ref.update(deleteDoc);

    await this.deleteProductFileFromStorage(deleteTargetId);

    return new Product(
      this.id,
      this.name,
      this.iconStorageUrl,
      this.description,
      this.ownerUid,
      newProductFileMap,
      this.createdAt,
      this.firestoreInstance
    );
  };

  private deleteProductFileFromStorage = async (
    deleteTargetId: string
  ): Promise<void> => {
    const deleteTargetProductFile = this.productFiles[deleteTargetId];

    if (!deleteTargetProductFile) {
      // tslint:disable-next-line:no-console
      console.error(`target product file doesn't exist. ID: ${deleteTargetId}`);
      return;
    }

    const targetRef = firebase
      .storage()
      .refFromURL(deleteTargetProductFile.storageUrl);
    await targetRef.delete();
  };

  public async getIconUrl(): Promise<string | null> {
    if (!this.iconStorageUrl) {
      return null;
    }

    if (this.cachedIconUrl) {
      return this.cachedIconUrl;
    }

    this.cachedIconUrl = await firebase
      .storage()
      .refFromURL(this.iconStorageUrl)
      .getDownloadURL();

    return this.cachedIconUrl;
  }

  public uploadIconToStorage(file: File): {
    task: UploadTask;
    promise: Promise<void>;
  } {
    const { currentUser } = firebase.auth();

    if (!currentUser) {
      throw new Error("unexpected error. logged-in user is null.");
    }

    const { uid } = currentUser;

    // after success, delete an old icon.
    const oldIconRef =
      this.iconStorageUrl && firebase.storage().refFromURL(this.iconStorageUrl);

    const originalFileName = file.name;

    // @ts-ignore
    // TODO: handle file having no extension
    const extension = originalFileName.split(".").pop().toLowerCase();

    const fileId = Product.createNewFileName();

    const storageRef = Product.getImageStorageRef(uid, this.id).child(
      `${fileId}.${extension}`
    );

    const task = storageRef.put(file, {});

    const promise = new Promise<void>((resolve) => {
      const unsubscribe = task.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        () => {
          //
        },
        (e) => {
          // TODO
          // tslint:disable-next-line
          console.error(e);
        },
        async () => {
          unsubscribe();

          const partialNewDoc: Partial<ProductDocument> = {
            iconStorageUrl: storageRef.toString(),
          };
          await this.ref.update(partialNewDoc);

          if (oldIconRef) {
            // it no longer be referred.
            await oldIconRef.delete();
          }

          resolve();
        }
      );
    });

    return {
      task,
      promise,
    };
  }

  public async partialUpdateFields(
    values: Partial<ProductDocument>
  ): Promise<void> {
    await this.ref.update({
      ...values,
    });
  }

  public async partialUpdateFile(
    updateId: string,
    edited: Partial<ProductFile>
  ) {
    const updateData: UpdateData = {};
    const productFilesKey: keyof Product = "productFiles";

    (Object.keys(edited) as (keyof ProductFile)[]).forEach((key) => {
      updateData[`${productFilesKey}.${updateId}.${key}`] = edited[key];
    });

    const newIndex = edited.index;

    // Indexに更新がある場合、他のElementのIndexも更新する
    if (typeof newIndex !== "undefined") {
      const oldIndex = this.productFiles[updateId].index;

      Object.keys(this.productFiles).forEach((sortTargetId) => {
        if (sortTargetId === updateId) {
          return;
        }

        const sortTargetOldIndex = this.productFiles[sortTargetId].index;
        const sortTargetIndexKey = `${productFilesKey}.${sortTargetId}.index`;

        // Indexの値が大きくなった場合、降順方向に他のIndex値をつめる
        if (oldIndex < newIndex) {
          if (
            oldIndex <= sortTargetOldIndex &&
            sortTargetOldIndex <= newIndex
          ) {
            updateData[sortTargetIndexKey] = sortTargetOldIndex - 1;
          }
        }

        // Indexの値が小さくなった場合、昇順方向に他のIndex値をつめる
        if (newIndex < oldIndex) {
          if (
            newIndex <= sortTargetOldIndex &&
            sortTargetOldIndex <= oldIndex
          ) {
            updateData[sortTargetIndexKey] = sortTargetOldIndex + 1;
          }
        }
      });
    }

    await this.ref.update(updateData);
  }

  private static createNewFileName(): string {
    return uuid();
  }

  /**
   * Get new unique id with logic of `AutoId.newId()`
   *
   * @link https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/api/database.ts#L2162
   */
  private static getAutoNewId() {
    return firebase.firestore().collection("any").doc().id;
  }
}
