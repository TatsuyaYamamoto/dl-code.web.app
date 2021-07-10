import { useEffect, useState, useCallback } from "react";
import firebase from "firebase/app";

import useFirebase from "./useFirebase";
import {
  Product,
  ProductDescription,
  ProductDocument,
  ProductDocRef,
  ProductFile,
  ProductFileDisplayName,
  ProductName,
} from "../../domains/Product";
import { editCounter as editDlCodeUserCounter } from "../../domains/DlCodeUser";
import useAuth from "./useAuth";

type UploadTask = firebase.storage.UploadTask;

const useProductEditor = (productId?: string) => {
  const { app: firebaseApp } = useFirebase();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);

  /**
   * @param nullableProduct
   * @private
   */
  const shouldProductRefLoaded = (nullableProduct: Product | null): Product => {
    if (!nullableProduct) {
      throw new Error("unexpected error. no product is ready.");
    }

    return nullableProduct;
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!productId) {
      return;
    }

    const unsubscribe = Product.watchOne(
      productId,
      firebaseApp.firestore(),
      (one) => {
        setProduct(one);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [firebaseApp, user, productId]);

  const addProduct = useCallback(
    async (
      name: ProductName,
      description: ProductDescription
    ): Promise<[ProductDocRef | void, ProductDocRef | void]> => {
      if (!user) {
        throw new Error(
          "unexpected. firebase and user haven't benn initialized."
        );
      }

      const { current: currentRegisteredCount, limit: maxRegisteredCount } =
        user.counters.product;

      if (maxRegisteredCount <= currentRegisteredCount) {
        throw new Error(
          `exceeded. max count. current: ${currentRegisteredCount}, limit: ${maxRegisteredCount}`
        );
      }

      // current countを改めて計算する、冗長だけれど、、
      const current = await Product.getCount(user.uid, firebaseApp.firestore());

      // TODO アトミックな処理に実装を変更する
      return Promise.all([
        editDlCodeUserCounter(
          user,
          "product",
          current + 1,
          firebaseApp.firestore()
        ),
        Product.createNew({ name, description }, firebaseApp.firestore()),
      ]);
    },
    [firebaseApp, user]
  );

  const updateProduct = useCallback(
    async (values: Partial<ProductDocument>) => {
      const loadedProduct = shouldProductRefLoaded(product);

      // TODO validate provided params
      await loadedProduct.partialUpdateFields(values);
    },
    [product]
  );

  const updateProductIcon = useCallback(
    async (icon: File) => {
      const loadedProduct = shouldProductRefLoaded(product);

      // TODO validate provided params
      const { promise } = loadedProduct.uploadIconToStorage(icon);

      return promise;
    },
    [product]
  );

  const addProductFile = useCallback(
    (
      displayName: ProductFileDisplayName,
      file: File
    ): {
      task: UploadTask;
      promise: Promise<void>;
    } => {
      const loadedProduct = shouldProductRefLoaded(product);
      if (!user) {
        throw new Error("non auth user logged-in.");
      }

      // check allowed host file size.
      const fileSizeByteTrying = file.size;

      const { current: currentFileSizeByte, limit: maxFileSizeByte } =
        user.counters.totalFileSizeByte;

      if (maxFileSizeByte < currentFileSizeByte + fileSizeByteTrying) {
        throw new Error(
          `exceeded. max count. current: ${currentFileSizeByte},  requested: ${fileSizeByteTrying}, limit: ${maxFileSizeByte}`
        );
      }

      const { task, promise } = loadedProduct.addProductFile(
        user.uid,
        displayName,
        file
      );

      return {
        task,
        // TODO アトミックな処理に実装を変更する
        promise: Promise.all([
          promise,
          editDlCodeUserCounter(
            user,
            "totalFileSizeByte",
            currentFileSizeByte + fileSizeByteTrying,
            firebaseApp.firestore()
          ),
        ]).then(),
      };
    },
    [firebaseApp, product, user]
  );

  const updateProductFile = useCallback(
    (id: string, edited: Partial<ProductFile>): Promise<void> => {
      const loadedProduct = shouldProductRefLoaded(product);
      return loadedProduct.partialUpdateFile(id, edited);
    },
    [product]
  );

  const deleteProductFile = useCallback(
    async (productFileId: string) => {
      if (!user) {
        throw new Error("non auth user logged-in.");
      }

      const loadedProduct = shouldProductRefLoaded(product);
      const deletingFileSizeByte =
        loadedProduct.productFiles[productFileId].size;

      const { current: currentFileSizeByte } = user.counters.totalFileSizeByte;

      // TODO アトミックな処理に実装を変更する
      return Promise.all([
        loadedProduct.deleteProductFile(productFileId),
        editDlCodeUserCounter(
          user,
          "totalFileSizeByte",
          currentFileSizeByte - deletingFileSizeByte,
          firebaseApp.firestore()
        ),
      ]);
    },
    [product, user, firebaseApp]
  );

  return {
    product,
    addProduct,
    updateProduct,
    updateProductIcon,
    addProductFile,
    updateProductFile,
    deleteProductFile,
  };
};

export default useProductEditor;
