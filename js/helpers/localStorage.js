/**
 * Safe localStorage operations with fallback through IndexedDB and sessionStorage
 * Handles cases when localStorage is unavailable (incognito mode, disabled cookies, etc.)
 * Fallback hierarchy: localStorage → IndexedDB → sessionStorage → memory
 */

// Fallback object for cases when all storage is unavailable
const memoryStorage = {
    storage: {},
    setItem(key, value) {
        this.storage[key] = value;
    },
    getItem(key) {
        return this.storage[key] || null;
    },
    removeItem(key) {
        delete this.storage[key];
    },
    clear() {
        this.storage = {};
    }
};

// IndexedDB wrapper for synchronous API
class IndexedDBStorage {
    constructor() {
        this.dbName = 'FallbackStorage';
        this.storeName = 'keyValue';
        this.version = 1;
        this.db = null;
        this.isReady = false;
        this.initPromise = this.init();
    }

    async init() {
        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);
                
                request.onerror = () => {
                    console.warn('Failed to open IndexedDB:', request.error);
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    this.db = request.result;
                    this.isReady = true;
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
            });
        } catch (error) {
            console.warn('IndexedDB initialization failed:', error);
            throw error;
        }
    }

    async ensureReady() {
        if (!this.isReady) {
            await this.initPromise;
        }
    }

    async setItem(key, value) {
        try {
            await this.ensureReady();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(value, key);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            throw error;
        }
    }

    async getItem(key) {
        try {
            await this.ensureReady();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);
                
                request.onsuccess = () => {
                    resolve(request.result !== undefined ? request.result : null);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            throw error;
        }
    }

    async removeItem(key) {
        try {
            await this.ensureReady();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(key);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            throw error;
        }
    }

    async clear() {
        try {
            await this.ensureReady();
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            throw error;
        }
    }
}

// Global IndexedDB storage instance
let indexedDBStorage = null;

/**
 * Check localStorage availability
 * @returns {boolean} true if localStorage is available
 */
function isLocalStorageAvailable() {
    try {
        const testKey = '_localStorage_test_';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Check sessionStorage availability
 * @returns {boolean} true if sessionStorage is available
 */
function isSessionStorageAvailable() {
    try {
        const testKey = '_sessionStorage_test_';
        window.sessionStorage.setItem(testKey, 'test');
        window.sessionStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Check IndexedDB availability
 * @returns {Promise<boolean>} true if IndexedDB is available
 */
async function isIndexedDBAvailable() {
    try {
        if (!window.indexedDB) {
            return false;
        }
        
        // Try to create test database
        const testDbName = '_indexedDB_test_' + Date.now();
        return new Promise((resolve) => {
            const request = indexedDB.open(testDbName, 1);
            
            request.onerror = () => resolve(false);
            request.onsuccess = () => {
                request.result.close();
                // Delete test database
                indexedDB.deleteDatabase(testDbName);
                resolve(true);
            };
            request.onupgradeneeded = (event) => {
                // Create test store
                const db = event.target.result;
                db.createObjectStore('test');
            };
        });
    } catch (e) {
        return false;
    }
}

/**
 * Get or create IndexedDB storage instance
 * @returns {Promise<IndexedDBStorage>} IndexedDB storage instance
 */
async function getIndexedDBStorage() {
    if (!indexedDBStorage) {
        indexedDBStorage = new IndexedDBStorage();
        try {
            await indexedDBStorage.initPromise;
        } catch (error) {
            console.warn('IndexedDB unavailable:', error);
            indexedDBStorage = null;
            throw error;
        }
    }
    return indexedDBStorage;
}

/**
 * Get safe storage object
 * Checks availability in order: localStorage → IndexedDB → sessionStorage → memory
 * @returns {Promise<{storage: Storage|Object, type: string}>} available storage or fallback object
 */
async function getSafeStorage() {
    // Try localStorage
    if (typeof window !== 'undefined' && window.localStorage && isLocalStorageAvailable()) {
        return { storage: window.localStorage, type: 'localStorage' };
    }
    
    // Fallback to IndexedDB
    try {
        if (typeof window !== 'undefined' && window.indexedDB && await isIndexedDBAvailable()) {
            console.warn('localStorage unavailable, using IndexedDB');
            const idbStorage = await getIndexedDBStorage();
            return { storage: idbStorage, type: 'indexedDB' };
        }
    } catch (error) {
        console.warn('IndexedDB unavailable:', error);
    }
    
    // Fallback to sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage && isSessionStorageAvailable()) {
        console.warn('localStorage and IndexedDB unavailable, using sessionStorage');
        return { storage: window.sessionStorage, type: 'sessionStorage' };
    }
    
    // Last fallback - memory
    console.warn('All storage unavailable, using memory storage');
    return { storage: memoryStorage, type: 'memory' };
}

/**
 * Synchronous version of getSafeStorage (without IndexedDB)
 * @returns {{storage: Storage|Object, type: string}} available storage or fallback object
 */
function getSafeStorageSync() {
    // Try localStorage
    if (typeof window !== 'undefined' && window.localStorage && isLocalStorageAvailable()) {
        return { storage: window.localStorage, type: 'localStorage' };
    }
    
    // Fallback to sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage && isSessionStorageAvailable()) {
        console.warn('localStorage unavailable, using sessionStorage');
        return { storage: window.sessionStorage, type: 'sessionStorage' };
    }
    
    // Last fallback - memory
    console.warn('localStorage and sessionStorage unavailable, using memory storage');
    return { storage: memoryStorage, type: 'memory' };
}

/**
 * Safely set value in storage
 * @param {string} key - key
 * @param {string} value - value
 * @returns {Promise<boolean>} true if operation was successful
 */
export async function safeSetItem(key, value) {
    try {
        const { storage, type } = await getSafeStorage();
        
        if (type === 'indexedDB') {
            await storage.setItem(key, value);
        } else {
            storage.setItem(key, value);
        }
        
        console.log(`Data saved to ${type}: ${key}`);
        return true;
    } catch (error) {
        console.error('Error writing to storage:', error);
        return false;
    }
}

/**
 * Safely get value from storage
 * @param {string} key - key
 * @returns {Promise<string|null>} value or null
 */
export async function safeGetItem(key) {
    try {
        const { storage, type } = await getSafeStorage();
        
        let value;
        if (type === 'indexedDB') {
            value = await storage.getItem(key);
        } else {
            value = storage.getItem(key);
        }
        
        if (value !== null) {
            console.log(`Data retrieved from ${type}: ${key}`);
        }
        return value;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return null;
    }
}

/**
 * Safely remove value from storage
 * @param {string} key - key
 * @returns {Promise<boolean>} true if operation was successful
 */
export async function safeRemoveItem(key) {
    try {
        const { storage, type } = await getSafeStorage();
        
        if (type === 'indexedDB') {
            await storage.removeItem(key);
        } else {
            storage.removeItem(key);
        }
        
        console.log(`Data removed from ${type}: ${key}`);
        return true;
    } catch (error) {
        console.error('Error removing from storage:', error);
        return false;
    }
}

/**
 * Safely clear storage
 * @returns {Promise<boolean>} true if operation was successful
 */
export async function safeClear() {
    try {
        const { storage, type } = await getSafeStorage();
        
        if (type === 'indexedDB') {
            await storage.clear();
        } else {
            storage.clear();
        }
        
        console.log(`Storage cleared: ${type}`);
        return true;
    } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
    }
}

/**
 * Get type of used storage
 * @returns {Promise<string>} 'localStorage', 'indexedDB', 'sessionStorage' or 'memory'
 */
export async function getStorageType() {
    const { type } = await getSafeStorage();
    return type;
}

/**
 * Synchronous version of getStorageType (without IndexedDB)
 * @returns {string} 'localStorage', 'sessionStorage' or 'memory'
 */
export function getStorageTypeSync() {
    const { type } = getSafeStorageSync();
    return type;
}

/**
 * Diagnostic function to check availability of all storage types
 * @returns {Promise<Object>} object with information about storage availability
 */
export async function getStorageInfo() {
    const indexedDBAvailable = await isIndexedDBAvailable();
    
    return {
        localStorage: {
            available: isLocalStorageAvailable(),
            exists: typeof window !== 'undefined' && !!window.localStorage
        },
        indexedDB: {
            available: indexedDBAvailable,
            exists: typeof window !== 'undefined' && !!window.indexedDB
        },
        sessionStorage: {
            available: isSessionStorageAvailable(),
            exists: typeof window !== 'undefined' && !!window.sessionStorage
        },
        currentStorage: await getStorageType()
    };
}

export { isLocalStorageAvailable, isSessionStorageAvailable, isIndexedDBAvailable, getSafeStorage, getSafeStorageSync };
