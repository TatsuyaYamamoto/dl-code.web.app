import React, { useEffect, useContext, FC, useState, useMemo } from "react";
import { useRouter } from "next/router";

import firebase from "firebase/app";

import useFirebase from "./useFirebase";
import {
  DlCodeUserDocument,
  getColRef as getDlCodeUserColRef,
} from "../../domains/DlCodeUser";
import { initUser as initUserApi } from "../../utils/api";

// export interface Auth0User extends _Auth0User {
//   /**
//    * twitterの表示名
//    */
//   nickname: string;
//
//   /**
//    * こっちもtwitterの表示名。screen_nameじゃないので、注意
//    * https://community.auth0.com/t/twitter-nickname-is-not-the-same-as-screen-name/17297/3
//    */
//   name: string;
//
//   /**
//    * アイコン画像URL
//    */
//   picture: string;
//   updated_at: string;
//   sub: string;
// }

export type SessionState = "processing" | "loggedIn" | "loggedOut";

export interface IAuthContext {
  firebaseUser?: firebase.User;
  idToken?: string;
  dlCodeUser?: DlCodeUserDocument;
  sessionState: SessionState;
}

const provider = new firebase.auth.TwitterAuthProvider();

export const AuthContext = React.createContext<IAuthContext>({} as any);

const log = (message?: any, ...optionalParams: any[]): void => {
  // tslint:disable-next-line
  console.log(`[useAuth] ${message}`, ...optionalParams);
};

export const AuthProvider: FC = (props) => {
  const { children } = props;
  const { app: firebaseApp } = useFirebase();
  const [contextValue, setContextValue] = useState<IAuthContext>({
    sessionState: "processing",
  });
  const firebaseUser = useMemo(() => contextValue.firebaseUser, [contextValue]);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((firebaseUser) => {
      log(`auth state was changed, uid: ${firebaseUser?.uid}`);

      if (firebaseUser) {
        setContextValue((prev) => ({
          ...prev,
          firebaseUser,
          sessionState: "loggedIn",
        }));
      } else {
        setContextValue((prev) => ({
          ...prev,
          firebaseUser: undefined,
          sessionState: "loggedOut",
        }));
      }
    });
  }, []);

  useEffect(() => {
    log(`start flow to init login session, uid: ${firebaseUser?.uid}`);
    if (!firebaseUser) {
      return;
    }

    const { uid } = firebaseUser;
    const unsubscribe = getDlCodeUserColRef()
      .doc(uid)
      .onSnapshot(async (snap) => {
        const dlCodeUser = snap.data();

        if (dlCodeUser) {
          setContextValue((prev) => ({
            ...prev,
            dlCodeUser,
          }));

          log(`DLCode user found. end login-flow. uid: ${uid} `);
        } else {
          const idToken = await firebaseApp.auth().currentUser?.getIdToken();
          if (!idToken) {
            throw new Error("unexpected. no id token");
          }
          initUserApi({ uid, idToken });

          log(
            `no DLCode user is on db. wait for backend to create new DLCode user. uid: ${uid}`
          );
        }
      });

    return () => {
      unsubscribe();
    };
  }, [firebaseApp, firebaseUser]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

const REDIRECT_PATH_KEY = "redirectPath";

const useAuth = (params?: { requiredAuth: boolean }) => {
  const router = useRouter();
  const { firebaseUser, dlCodeUser, sessionState, idToken } =
    useContext(AuthContext);

  const user = useMemo(() => {
    if (!firebaseUser || !dlCodeUser) {
      return null;
    }
    return {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || "表示名設定なし",
      iconUrl: firebaseUser.photoURL || "",
      counters: dlCodeUser.counters,
    };
  }, [firebaseUser, dlCodeUser]);

  const login = (): Promise<void> => {
    return firebase.auth().signInWithRedirect(provider);
  };

  const logout = (): Promise<void> => {
    return firebase.auth().signOut();
  };

  useEffect(() => {
    if (params?.requiredAuth && sessionState === "loggedOut") {
      router.push(`/login?${REDIRECT_PATH_KEY}=${window.location.pathname}`);
    }
  }, [router, params?.requiredAuth, sessionState]);

  useEffect(() => {
    const { [REDIRECT_PATH_KEY]: redirectPath, ...otherQuery } = router.query;

    if (sessionState === "loggedIn" && typeof redirectPath === "string") {
      log(
        `client is logged-in and has redirectPath query. redirect to ${redirectPath}`
      );
      router.replace({ pathname: redirectPath, query: otherQuery });
    }
  }, [sessionState, router]);

  return {
    user,
    sessionState,
    idToken,
    login,
    logout,
  };
};

export default useAuth;
