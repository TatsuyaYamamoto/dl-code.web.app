export default {
  contactFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSe5bSPvJ5XQM0IACqZ9NKoHuRUAcC_V1an16JGwHh6HeGd-oQ/viewform?usp=pp_url&entry.326070868=DLCode",
  twitterUrl: "https://twitter.com/T28_tatsuya",
  firebaseConfigs:
    process.env.NODE_ENV === "production"
      ? {
          apiKey: "AIzaSyCooAMMW0UzfXJln2JUHkKIv8Va4tzLUt0",
          authDomain: "dl-code.firebaseapp.com",
          databaseURL: "https://dl-code.firebaseio.com",
          projectId: "dl-code",
          storageBucket: "dl-code.appspot.com",
          messagingSenderId: "60887072982",
          appId: "1:60887072982:web:174e519749625525"
        }
      : {
          apiKey: "AIzaSyDkyIH-immHfoQY59kbEfWi9T1npPTUv0k",
          authDomain: "dl-code-dev.firebaseapp.com",
          databaseURL: "https://dl-code-dev.firebaseio.com",
          projectId: "dl-code-dev",
          storageBucket: "dl-code-dev.appspot.com",
          messagingSenderId: "170382784624",
          appId: "1:170382784624:web:42b794526ad81a74"
        }
};
