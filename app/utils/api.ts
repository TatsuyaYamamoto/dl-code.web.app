import configs from "../configs";

export const initUser = (params: { uid: string; idToken: string }) => {
  return fetch(`${configs.apiBaseUrl}/api/users/${params.uid}/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.idToken}`,
    },
  });
};
