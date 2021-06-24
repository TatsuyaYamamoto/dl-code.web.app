import React, { useState, useEffect, createContext, useContext } from "react";

import firebase from "firebase/app";

import useAuth0 from "./useAuth0";
import configs from "../../configs";

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
  const [contextValue, setContextValue] = useState<IFirebaseContext>(() => {
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
  const { initialized: isAuth0Initialized, idToken: auth0IdToken } = useAuth0();

  useEffect(() => {
    const unsubscribe = contextValue.app
      .auth()
      .onAuthStateChanged((changedUser) => {
        log(`firebase auth state is changed. uid: ${changedUser?.uid}`);

        setContextValue((prev) => ({
          ...prev,
          user: changedUser ? changedUser : undefined,
          authStateChecked: true,
        }));
      });

    return () => {
      unsubscribe();
    };
    // TODO
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    log(`start flow of sign-in firebase auth.`);
    const { app: firebaseAppInstance } = contextValue;

    if (!isAuth0Initialized) {
      log(`suspend sign-in flow. auth0 client has not been initialized.`);
      return;
    }

    (async () => {
      if (auth0IdToken) {
        log("sign-in to firebase app with custom token.");
        const token = await getFirebaseCustomToken(auth0IdToken);
        await firebaseAppInstance.auth().signInWithCustomToken(token);
      } else {
        log("no auth0 idToken is hold. sign out from firebase app.");
        await firebaseAppInstance.auth().signOut();
      }
    })();
  }, [contextValue, isAuth0Initialized, auth0IdToken]);

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

/**
 * @private
 * @param bearerToken
 */
const getFirebaseCustomToken = async (bearerToken: string) => {
  const response = await fetch(`${configs.apiServerOrigin}/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scope: "dl-code.web.app",
    }),
  });
  if (response.ok) {
    const json = await response.json();
    return json.token;
  }
  throw new Error(await response.text());
};

export default useFirebase;
export { FirebaseContextProvider };
