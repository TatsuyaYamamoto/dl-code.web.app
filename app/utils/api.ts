import configs from "../configs";

export const initUser = (uid: string) => {
  return fetch(`${configs.apiBaseUrl}/api/users/${uid}/init`, {
    method: "POST",
  });
};
