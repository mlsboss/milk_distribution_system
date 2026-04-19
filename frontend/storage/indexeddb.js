const DB_NAME = "milk_app_db";
const DB_VERSION = 1;
const STORE_NAME = "offline_transactions";

// ---------- OPEN DATABASE ----------
function openDB() {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create store if not exists
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true
                });

                // Optional index
                store.createIndex("date", "date", { unique: false });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject("Error opening DB");
        };
    });
}

// ---------- SAVE ENTRY ----------
export async function saveOfflineEntry(data) {
    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const request = store.add(data);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject("Error saving data");
    });
}

// ---------- GET ALL ENTRIES ----------
export async function getOfflineEntries() {
    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error fetching data");
    });
}

// ---------- DELETE ONE ENTRY ----------
export async function deleteOfflineEntry(id) {
    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject("Error deleting entry");
    });
}

// ---------- CLEAR ALL ----------
export async function clearOfflineEntries() {
    const db = await openDB();

    return new Promise((resolve, reject) => {

        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject("Error clearing data");
    });
}