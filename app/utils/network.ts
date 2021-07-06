import firebase from "firebase/app";
import { DownloadCodeSet } from "../domains/DownloadCodeSet";

export const saveDownloadCodeSetAsCsvFile = (codeSet: DownloadCodeSet) => {
  const id = codeSet.id;
  const codes = Object.keys(codeSet.codes).map((value) => value);

  let csvContent = "data:text/csv;charset=utf-8,";
  codes.forEach((code) => {
    csvContent += `${code}\r\n`;
  });

  const a = document.createElement("a");
  a.href = encodeURI(csvContent);
  a.target = "_blank";
  a.download = `download_code_set_${id}.csv`;
  a.click();
};

export const getStorageObjectDownloadUrl = (storageUrl: string) => {
  return firebase.storage().refFromURL(storageUrl).getDownloadURL();
};

export const downloadFromFirebaseStorage = async (
  storageUrl: string,
  originalName: string
): Promise<void> => {
  const downloadUrl = await getStorageObjectDownloadUrl(storageUrl);

  const res = await fetch(downloadUrl);

  // chrome 91.0.4472.114（Official Build）の環境でblob()がコケるのでarrayBuffer経由で読み込む (safari, iOS13.5ではコケない)
  // const blob = await res.blob();
  const arrayBuffer = await res.arrayBuffer();
  const blob = new Blob([arrayBuffer]);

  const a = document.createElement("a");
  a.download = originalName;
  a.href = window.URL.createObjectURL(blob);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
