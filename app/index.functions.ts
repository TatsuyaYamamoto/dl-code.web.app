import * as functions from "firebase-functions";

export const api = functions.https.onRequest((_, response) => {
  response.json({
    message: "api!"
  });
});
