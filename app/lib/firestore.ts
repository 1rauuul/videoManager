import { Firestore, Timestamp } from "@google-cloud/firestore";

const firestore = new Firestore({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const usersCollection = firestore.collection("users");
const videoUploadedCollection = firestore.collection("videoUploaded");

// =========================
// Users
// =========================

export interface User {
  id: string;
  userName: string;
  password: string;
  nombre: string;
  email: string;
}

export async function getUserByUserName(userName: string): Promise<User | null> {
  const snapshot = await usersCollection
    .where("UserName", "==", userName)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    userName: data.UserName ?? "",
    password: data.Password ?? "",
    nombre: data.Nombre ?? "",
    email: data.Email ?? "",
  };
}

export async function createUser(userData: {
  userName: string;
  password: string;
  nombre: string;
  email: string;
}): Promise<User> {
  const existing = await getUserByUserName(userData.userName);
  if (existing) {
    throw new Error("El nombre de usuario ya existe.");
  }

  const docRef = await usersCollection.add({
    UserName: userData.userName,
    Password: userData.password,
    Nombre: userData.nombre,
    Email: userData.email,
  });

  return {
    id: docRef.id,
    userName: userData.userName,
    password: userData.password,
    nombre: userData.nombre,
    email: userData.email,
  };
}

export async function loginUser(
  userName: string,
  password: string
): Promise<User | null> {
  const user = await getUserByUserName(userName);
  if (!user || user.password !== password) {
    return null;
  }
  return user;
}

// =========================
// VideoUploaded
// =========================

export interface VideoUploadedDoc {
  id: string;
  fileName: string;
  userName: string;
  idUser: string;
  nameVideo: string;
  dateSubida: Timestamp | { _seconds?: number };
}

export async function createVideoUploaded(videoData: {
  id: string;
  fileName: string;
  userName: string;
  idUser: string;
  nameVideo: string;
}): Promise<VideoUploadedDoc> {
  const user = await getUserByUserName(videoData.userName);
  if (!user) {
    throw new Error("El usuario especificado no existe.");
  }

  const videoDoc = {
    FileName: videoData.fileName,
    UserName: videoData.userName,
    IdUser: videoData.idUser,
    NameVideo: videoData.nameVideo,
    DateSubida: Timestamp.now(),
  };

  await videoUploadedCollection.doc(videoData.id).set(videoDoc);

  return {
    id: videoData.id,
    fileName: videoData.fileName,
    userName: videoData.userName,
    idUser: videoData.idUser,
    nameVideo: videoData.nameVideo,
    dateSubida: videoDoc.DateSubida,
  };
}

function getSecondsFromDateSubida(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && "seconds" in value && typeof (value as { seconds: number }).seconds === "number") {
    return (value as { seconds: number }).seconds;
  }
  if (typeof value === "object" && "_seconds" in value && typeof (value as { _seconds: number })._seconds === "number") {
    return (value as { _seconds: number })._seconds;
  }
  return 0;
}

export async function getVideosByUserId(idUser: string): Promise<VideoUploadedDoc[]> {
  const snapshot = await videoUploadedCollection
    .where("IdUser", "==", idUser)
    .get();

  const videos = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      fileName: d.FileName ?? "",
      userName: d.UserName ?? "",
      idUser: d.IdUser ?? "",
      nameVideo: d.NameVideo ?? "",
      dateSubida: d.DateSubida ?? null,
    };
  });

  // Más recientes arriba, más viejos abajo
  videos.sort((a, b) => getSecondsFromDateSubida(b.dateSubida) - getSecondsFromDateSubida(a.dateSubida));

  return videos;
}

export async function deleteVideoUploaded(id: string): Promise<void> {
  const docRef = videoUploadedCollection.doc(id);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error("El video no existe.");
  }
  await docRef.delete();
}
