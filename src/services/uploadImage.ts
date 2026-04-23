import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadImage = async (uri: string, path: string) => {
  const storage = getStorage();

  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob);

  return await getDownloadURL(storageRef);
};