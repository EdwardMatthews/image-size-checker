import type { ImageAsset, ImagePreset, ResizeSettings } from './image-tools';

const DB_NAME = 'image-size-checker-transfers';
const STORE_NAME = 'resize-transfers';
const DB_VERSION = 1;
const TRANSFER_TTL_MS = 60 * 60 * 1000;

export interface ResizeTransferRecord {
  id: string;
  file: File;
  presetId: string;
  width: number;
  height: number;
  fit: ResizeSettings['fit'];
  createdAt: number;
}

export async function saveResizeTransfer(
  asset: ImageAsset,
  preset: ImagePreset
) {
  const id = crypto.randomUUID();
  const db = await openTransferDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(
    store.put({
      id,
      file: asset.file,
      presetId: preset.id,
      width: preset.width,
      height: preset.height,
      fit: 'stretch',
      createdAt: Date.now(),
    } satisfies ResizeTransferRecord)
  );
  await transactionDone(tx);
  db.close();
  cleanupResizeTransfers().catch(() => undefined);
  return id;
}

export async function loadResizeTransfer(id: string) {
  const db = await openTransferDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const record = await requestToPromise<ResizeTransferRecord | undefined>(
    tx.objectStore(STORE_NAME).get(id)
  );
  await transactionDone(tx);
  db.close();

  if (!record) return null;
  if (Date.now() - record.createdAt > TRANSFER_TTL_MS) {
    await deleteResizeTransfer(id);
    return null;
  }
  return record;
}

export async function deleteResizeTransfer(id: string) {
  const db = await openTransferDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await requestToPromise(tx.objectStore(STORE_NAME).delete(id));
  await transactionDone(tx);
  db.close();
}

async function cleanupResizeTransfers() {
  const db = await openTransferDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const records = await requestToPromise<ResizeTransferRecord[]>(
    store.getAll()
  );
  const cutoff = Date.now() - TRANSFER_TTL_MS;
  await Promise.all(
    records
      .filter((record) => record.createdAt < cutoff)
      .map((record) => requestToPromise(store.delete(record.id)))
  );
  await transactionDone(tx);
  db.close();
}

function openTransferDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open transfer storage.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Transfer storage request failed.'));
  });
}

function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error('Transfer storage transaction failed.'));
    tx.onabort = () =>
      reject(
        tx.error ?? new Error('Transfer storage transaction was aborted.')
      );
  });
}
