import {
  default as React,
  createContext,
  useEffect,
  useState,
  useContext,
} from "react";

import useFirebase from "./useFirebase";
import useAuth0 from "./useAuth0";
import { DlCodeUser, DlCodeUserDocument } from "../../domains/DlCodeUser";

export type SessionState = "processing" | "loggedIn" | "loggedOut";

const log = (message?: any, ...optionalParams: any[]): void => {
  // tslint:disable-next-line
  console.log(`[useDlCodeUser] ${message}`, ...optionalParams);
};

interface IDlCodeUserContext {
  user?: DlCodeUser;
  sessionState: SessionState;
}

export const dlCodeUserContext = createContext<IDlCodeUserContext>({} as any);

export const DlCodeUserContextProvider: React.FC<{}> = (props) => {
  const [contextValue, setContextValue] = useState<IDlCodeUserContext>({
    sessionState: "processing",
  });
  const { app: firebaseApp, initUser } = useFirebase();
  const { initialized: isAuth0Initialized, user: auth0User } = useAuth0();

  const handleLogout = () => {
    setContextValue((prev) => ({
      ...prev,
      sessionState: "loggedOut",
      user: undefined,
    }));
  };

  const handleLogin = (user: DlCodeUser) => {
    setContextValue((prev) => ({
      ...prev,
      sessionState: "loggedIn",
      user,
    }));
  };

  useEffect(() => {
    log(`start flow of loading DlCodeUser.`);

    if (!isAuth0Initialized) {
      log(`suspend loading-flow. auth0 has not been initialized`);
      return;
    }

    if (!auth0User) {
      log("user is not logged-in as auth0 user.");
      handleLogout();
      return;
    }

    const uid = auth0User.sub;
    log(`user is logged-in as auth0 user. uid: ${uid}`);

    const unsubscribe = DlCodeUser.getColRef(firebaseApp.firestore())
      .doc(uid)
      .onSnapshot((snap) => {
        if (snap.exists) {
          const dlCodeUserDoc = snap.data() as DlCodeUserDocument;
          const user = new DlCodeUser(dlCodeUserDoc, auth0User);

          log(`DLCode user found. end login-flow. uid: ${uid} `);
          handleLogin(user);
        } else {
          initUser(uid);
          log(
            `no DLCode user is on db. wait for backend to create new DLCode user. uid: ${uid} `
          );
        }
      });

    return () => {
      unsubscribe();
    };
    // TODO
    // eslint-disable-next-line
  }, [firebaseApp, isAuth0Initialized, auth0User]);

  return (
    <dlCodeUserContext.Provider value={contextValue}>
      {props.children}
    </dlCodeUserContext.Provider>
  );
};

const useDlCodeUser = () => {
  const { user, sessionState } = useContext(dlCodeUserContext);

  return { user, sessionState };
};

export default useDlCodeUser;
