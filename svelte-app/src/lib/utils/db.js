// IndexedDB helpers for vocabulary file storage

const VOCAB_DB_NAME = 'anki_scribe_vocab';
const VOCAB_DB_VERSION = 1;
const VOCAB_STORE_NAME = 'files';

function openVocabDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(VOCAB_DB_NAME, VOCAB_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VOCAB_STORE_NAME)) {
        db.createObjectStore(VOCAB_STORE_NAME, { keyPath: 'slug' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeVocabFile(slug, displayName, textContent) {
  const db = await openVocabDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOCAB_STORE_NAME, 'readwrite');
    tx.objectStore(VOCAB_STORE_NAME).put({ slug, name: displayName, text: textContent });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadVocabFile(slug) {
  const db = await openVocabDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOCAB_STORE_NAME, 'readonly');
    const req = tx.objectStore(VOCAB_STORE_NAME).get(slug);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVocabFile(slug) {
  const db = await openVocabDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VOCAB_STORE_NAME, 'readwrite');
    tx.objectStore(VOCAB_STORE_NAME).delete(slug);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
