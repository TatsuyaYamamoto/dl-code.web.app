const parseStorageUrl = (
  storageUrl: string
): { bucket: string; fileName: string } => {
  // e.g. gs://dl-code-dev.appspot.com/users/twitter|298062670/products/OVkpgAiyY7LYJvtcBrQJ/images/16f02204-63eb-429f-b25c-64673f556cf9.jpeg
  const [bucket, ...pathParts] = storageUrl.replace("gs://", "").split("/");
  const fileName = pathParts.join("/");
  return { bucket, fileName };
};

export const getUnsignedDownloadUrl = (storageUrl: string) => {
  const { bucket, fileName } = parseStorageUrl(storageUrl);
  const encodedFileName = encodeURIComponent(fileName);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedFileName}?alt=media`;
};
