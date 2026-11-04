export interface BodyDiaryPhoto {
  id: string;
  member: "thong" | "thuan";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  photoDataUrl: string; // compressed base64 image
  note?: string | undefined;
  weightKg?: number | undefined;
  createdAt: string; // ISO
}

const DB_NAME = "lpgb_body_diary_db";
const DB_VERSION = 1;
const STORE_NAME = "photos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("member", "member", { unique: false });
        store.createIndex("date", "date", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Resizes and compresses an image to keep it lightweight (~100-250KB)
 * while preserving great visual quality for body check-ins.
 */
export async function compressImage(
  fileOrDataUrl: File | Blob | string,
  maxDimension = 1080,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get 2D canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error("Failed to read image file"));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export async function getBodyDiaryPhotos(member: "thong" | "thuan"): Promise<BodyDiaryPhoto[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("member");
      const request = index.getAll(member);

      request.onsuccess = () => {
        const results = (request.result as BodyDiaryPhoto[]) || [];
        // Sort newest first
        results.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to fetch diary photos from IndexedDB:", err);
    return [];
  }
}

export async function addBodyDiaryPhoto(entry: {
  member: "thong" | "thuan";
  date: string;
  time: string;
  photoDataUrl: string;
  note?: string | undefined;
  weightKg?: number | undefined;
}): Promise<BodyDiaryPhoto> {
  const db = await openDB();
  const record: BodyDiaryPhoto = {
    id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    member: entry.member,
    date: entry.date,
    time: entry.time,
    photoDataUrl: entry.photoDataUrl,
    note: entry.note?.trim() || undefined,
    weightKg: entry.weightKg,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteBodyDiaryPhoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
