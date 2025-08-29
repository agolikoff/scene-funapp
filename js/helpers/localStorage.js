/**
 * Безопасная работа с localStorage с fallback через IndexedDB и sessionStorage
 * Обрабатывает случаи, когда localStorage недоступен (инкогнито режим, отключенные cookies, etc.)
 * Иерархия fallback: localStorage → IndexedDB → sessionStorage → память
 */

// Fallback объект для случаев, когда все хранилища недоступны
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

// IndexedDB wrapper для синхронного API
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
                    console.warn('IndexedDB не удалось открыть:', request.error);
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
            console.warn('IndexedDB инициализация не удалась:', error);
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

// Глобальный экземпляр IndexedDB storage
let indexedDBStorage = null;

/**
 * Проверяет доступность localStorage
 * @returns {boolean} true если localStorage доступен
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
 * Проверяет доступность sessionStorage
 * @returns {boolean} true если sessionStorage доступен
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
 * Проверяет доступность IndexedDB
 * @returns {Promise<boolean>} true если IndexedDB доступен
 */
async function isIndexedDBAvailable() {
    try {
        if (!window.indexedDB) {
            return false;
        }
        
        // Пробуем создать тестовую базу данных
        const testDbName = '_indexedDB_test_' + Date.now();
        return new Promise((resolve) => {
            const request = indexedDB.open(testDbName, 1);
            
            request.onerror = () => resolve(false);
            request.onsuccess = () => {
                request.result.close();
                // Удаляем тестовую базу
                indexedDB.deleteDatabase(testDbName);
                resolve(true);
            };
            request.onupgradeneeded = (event) => {
                // Создаем тестовый store
                const db = event.target.result;
                db.createObjectStore('test');
            };
        });
    } catch (e) {
        return false;
    }
}

/**
 * Получает или создает экземпляр IndexedDB storage
 * @returns {Promise<IndexedDBStorage>} экземпляр IndexedDB storage
 */
async function getIndexedDBStorage() {
    if (!indexedDBStorage) {
        indexedDBStorage = new IndexedDBStorage();
        try {
            await indexedDBStorage.initPromise;
        } catch (error) {
            console.warn('IndexedDB недоступен:', error);
            indexedDBStorage = null;
            throw error;
        }
    }
    return indexedDBStorage;
}

/**
 * Получает безопасный объект для работы с хранилищем
 * Проверяет доступность в порядке: localStorage → IndexedDB → sessionStorage → память
 * @returns {Promise<{storage: Storage|Object, type: string}>} доступное хранилище или fallback объект
 */
async function getSafeStorage() {
    // Пробуем localStorage
    if (typeof window !== 'undefined' && window.localStorage && isLocalStorageAvailable()) {
        return { storage: window.localStorage, type: 'localStorage' };
    }
    
    // Fallback на IndexedDB
    try {
        if (typeof window !== 'undefined' && window.indexedDB && await isIndexedDBAvailable()) {
            console.warn('localStorage недоступен, используется IndexedDB');
            const idbStorage = await getIndexedDBStorage();
            return { storage: idbStorage, type: 'indexedDB' };
        }
    } catch (error) {
        console.warn('IndexedDB недоступен:', error);
    }
    
    // Fallback на sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage && isSessionStorageAvailable()) {
        console.warn('localStorage и IndexedDB недоступны, используется sessionStorage');
        return { storage: window.sessionStorage, type: 'sessionStorage' };
    }
    
    // Последний fallback - память
    console.warn('Все хранилища недоступны, используется хранилище в памяти');
    return { storage: memoryStorage, type: 'memory' };
}

/**
 * Синхронная версия getSafeStorage (без IndexedDB)
 * @returns {{storage: Storage|Object, type: string}} доступное хранилище или fallback объект
 */
function getSafeStorageSync() {
    // Пробуем localStorage
    if (typeof window !== 'undefined' && window.localStorage && isLocalStorageAvailable()) {
        return { storage: window.localStorage, type: 'localStorage' };
    }
    
    // Fallback на sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage && isSessionStorageAvailable()) {
        console.warn('localStorage недоступен, используется sessionStorage');
        return { storage: window.sessionStorage, type: 'sessionStorage' };
    }
    
    // Последний fallback - память
    console.warn('localStorage и sessionStorage недоступны, используется хранилище в памяти');
    return { storage: memoryStorage, type: 'memory' };
}

/**
 * Безопасно устанавливает значение в хранилище
 * @param {string} key - ключ
 * @param {string} value - значение
 * @returns {Promise<boolean>} true если операция прошла успешно
 */
export async function safeSetItem(key, value) {
    try {
        const { storage, type } = await getSafeStorage();
        
        if (type === 'indexedDB') {
            await storage.setItem(key, value);
        } else {
            storage.setItem(key, value);
        }
        
        console.log(`Данные сохранены в ${type}: ${key}`);
        return true;
    } catch (error) {
        console.error('Ошибка при записи в хранилище:', error);
        return false;
    }
}

/**
 * Безопасно получает значение из хранилища
 * @param {string} key - ключ
 * @returns {Promise<string|null>} значение или null
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
            console.log(`Данные получены из ${type}: ${key}`);
        }
        return value;
    } catch (error) {
        console.error('Ошибка при чтении из хранилища:', error);
        return null;
    }
}

/**
 * Безопасно удаляет значение из хранилища
 * @param {string} key - ключ
 * @returns {Promise<boolean>} true если операция прошла успешно
 */
export async function safeRemoveItem(key) {
    try {
        const { storage, type } = await getSafeStorage();
        
        if (type === 'indexedDB') {
            await storage.removeItem(key);
        } else {
            storage.removeItem(key);
        }
        
        console.log(`Данные удалены из ${type}: ${key}`);
        return true;
    } catch (error) {
        console.error('Ошибка при удалении из хранилища:', error);
        return false;
    }
}

/**
 * Безопасно очищает хранилище
 * @returns {Promise<boolean>} true если операция прошла успешно
 */
export async function safeClear() {
    try {
        const { storage, type } = await getSafeStorage();
        
        if (type === 'indexedDB') {
            await storage.clear();
        } else {
            storage.clear();
        }
        
        console.log(`Хранилище очищено: ${type}`);
        return true;
    } catch (error) {
        console.error('Ошибка при очистке хранилища:', error);
        return false;
    }
}

/**
 * Получает тип используемого хранилища
 * @returns {Promise<string>} 'localStorage', 'indexedDB', 'sessionStorage' или 'memory'
 */
export async function getStorageType() {
    const { type } = await getSafeStorage();
    return type;
}

/**
 * Синхронная версия getStorageType (без IndexedDB)
 * @returns {string} 'localStorage', 'sessionStorage' или 'memory'
 */
export function getStorageTypeSync() {
    const { type } = getSafeStorageSync();
    return type;
}

/**
 * Диагностическая функция для проверки доступности всех типов хранилища
 * @returns {Promise<Object>} объект с информацией о доступности хранилищ
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
