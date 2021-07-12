import React, { FC, useState, createContext, useContext } from "react";
import firebase from "firebase/app";

import { EMULATOR_URLS, FIREBASE_CONFIG } from "../../configs";

type FirebaseApp = firebase.app.App;
type FirebaseUser = firebase.User;

interface IFirebaseContext {
  app: FirebaseApp;
  user?: FirebaseUser;
}

const firebaseContext = createContext<IFirebaseContext>(null as any);

const FirebaseContextProvider: FC = (props) => {
  const [contextValue] = useState<IFirebaseContext>(() => {
    const app = firebase.apps[0] ?? firebase.initializeApp(FIREBASE_CONFIG);

    if (EMULATOR_URLS) {
      const { functions, firestore, storage, auth } = EMULATOR_URLS;
      app.functions().useEmulator(functions.host, functions.port);
      app.firestore().useEmulator(firestore.host, firestore.port);
      app.storage().useEmulator(storage.host, storage.port);
      app.auth().useEmulator(auth.url);
    }

    // @ts-ignore
    log(`firebase app initialized. projectId: ${app.options.projectId}`);

    return {
      app,
    };
  });

  return (
    <firebaseContext.Provider value={contextValue}>
      {props.children}
    </firebaseContext.Provider>
  );
};

const useFirebase = () => {
  const { app, user } = useContext(firebaseContext);

  return {
    app,
    user,
  };
};

/**
 * @private
 * @param message
 * @param optionalParams
 */
const log = (message?: any, ...optionalParams: any[]): void => {
  // tslint:disable-next-line
  console.log(`[useFirebase] ${message}`, ...optionalParams);
};

export default useFirebase;
export { FirebaseContextProvider };
