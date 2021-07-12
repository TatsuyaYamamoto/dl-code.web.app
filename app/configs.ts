export const EMULATOR =
  (process.env.NEXT_PUBLIC_EMULATOR || process.env.EMULATOR) === "true";
export const PRODUCTION =
  (process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV) === "production";

export const CONTACT_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe5bSPvJ5XQM0IACqZ9NKoHuRUAcC_V1an16JGwHh6HeGd-oQ/viewform?usp=pp_url&entry.326070868=DLCode";

export const TWITTER_URL = "https://twitter.com/T28_tatsuya";

export const FIREBASE_CONFIG = PRODUCTION
  ? {
      apiKey: "AIzaSyCooAMMW0UzfXJln2JUHkKIv8Va4tzLUt0",
      authDomain: "dl-code.firebaseapp.com",
      databaseURL: "https://dl-code.firebaseio.com",
      projectId: "dl-code",
      storageBucket: "dl-code.appspot.com",
      messagingSenderId: "60887072982",
      appId: "1:60887072982:web:174e519749625525",
    }
  : {
      apiKey: "AIzaSyDkyIH-immHfoQY59kbEfWi9T1npPTUv0k",
      authDomain: "dl-code-dev.firebaseapp.com",
      databaseURL: "https://dl-code-dev.firebaseio.com",
      projectId: "dl-code-dev",
      storageBucket: "dl-code-dev.appspot.com",
      messagingSenderId: "170382784624",
      appId: "1:170382784624:web:42b794526ad81a74",
    };

export const API_BASE_URL = EMULATOR
  ? "http://localhost:5001/dl-code-dev/asia-northeast1"
  : PRODUCTION
  ? "https://asia-northeast1-dl-code.cloudfunctions.net"
  : "https://asia-northeast1-dl-code-dev.cloudfunctions.net";

export const EMULATOR_URLS = EMULATOR
  ? {
      functions: { host: "localhost", port: 5001 },
      firestore: { host: "localhost", port: 5002 },
      storage: { host: "localhost", port: 5003 },
      auth: { url: "http://localhost:5004" },
    }
  : null;
