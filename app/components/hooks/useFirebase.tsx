import React, { useState, createContext, useContext } from "react";

import firebase from "firebase/app";

type FirebaseApp = firebase.app.App;
type FirebaseUser = firebase.User;

interface IFirebaseContext {
  app: FirebaseApp;
  user?: FirebaseUser;
  authStateChecked: boolean;
}

interface FirebaseContextProviderProps {
  initParams: { options: object; name?: string };
}

const firebaseContext = createContext<IFirebaseContext>(null as any);

const FirebaseContextProvider: React.FC<FirebaseContextProviderProps> = (
  props
) => {
  const { initParams } = props;
  const [contextValue] = useState<IFirebaseContext>(() => {
    const app =
      firebase.apps[0] ??
      firebase.initializeApp(initParams.options, initParams.name);

    if (process.env.emulator) {
      app.functions().useEmulator("localhost", 5001);
      app.firestore().useEmulator("localhost", 5002);
      app.storage().useEmulator("localhost", 5003);
      app.auth().useEmulator("http://localhost:5004");
    }

    // @ts-ignore
    log(`firebase app initialized. projectId: ${app.options.projectId}`);

    return {
      authStateChecked: false,
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
  const { app, user, authStateChecked } = useContext(firebaseContext);

  return {
    authStateChecked,
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
