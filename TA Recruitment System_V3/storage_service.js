window.StorageService = (function () {
    const STORAGE_META_KEY = "__storage_meta__";
    const CURRENT_VERSION = 1;

    const nativeGetItem = Storage.prototype.getItem;
    const nativeSetItem = Storage.prototype.setItem;
    const nativeRemoveItem = Storage.prototype.removeItem;
    const nativeClear = Storage.prototype.clear;

    const memoryStore = {};
    let useMemoryFallback = false;

    function safeCall(fn, fallbackValue) {
        try {
            return fn();
        } catch (error) {
            useMemoryFallback = true;
            return fallbackValue;
        }
    }

    function memoryGet(key) {
        return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    }

    function memorySet(key, value) {
        memoryStore[key] = String(value);
    }

    function memoryRemove(key) {
        delete memoryStore[key];
    }

    function memoryClear() {
        Object.keys(memoryStore).forEach((key) => delete memoryStore[key]);
    }

    function readRaw(key) {
        if (useMemoryFallback) return memoryGet(key);
        return safeCall(function () {
            return nativeGetItem.call(window.localStorage, key);
        }, memoryGet(key));
    }

    function writeRaw(key, value) {
        if (useMemoryFallback) {
            memorySet(key, value);
            return;
        }
        safeCall(function () {
            nativeSetItem.call(window.localStorage, key, String(value));
            memorySet(key, value);
        });
    }

    function removeRaw(key) {
        if (useMemoryFallback) {
            memoryRemove(key);
            return;
        }
        safeCall(function () {
            nativeRemoveItem.call(window.localStorage, key);
            memoryRemove(key);
        });
    }

    function clearRaw() {
        if (useMemoryFallback) {
            memoryClear();
            return;
        }
        safeCall(function () {
            nativeClear.call(window.localStorage);
            memoryClear();
        });
    }

    function getJSON(key, fallbackValue) {
        const raw = readRaw(key);
        if (raw === null || raw === undefined || raw === "") return fallbackValue;
        try {
            return JSON.parse(raw);
        } catch (error) {
            return fallbackValue;
        }
    }

    function setJSON(key, value) {
        try {
            writeRaw(key, JSON.stringify(value));
        } catch (error) {
            writeRaw(key, "null");
        }
    }

    function updateJSON(key, updater, fallbackValue) {
        const current = getJSON(key, fallbackValue);
        const next = updater(current);
        setJSON(key, next);
        return next;
    }

    function readMeta() {
        const meta = getJSON(STORAGE_META_KEY, null);
        if (!meta || typeof meta.version !== "number") {
            return { version: 0, migratedAt: null };
        }
        return meta;
    }

    function writeMeta(version) {
        setJSON(STORAGE_META_KEY, {
            version: version,
            migratedAt: new Date().toISOString()
        });
    }

    function migrateToV1() {
        updateJSON("chatMessages", function (items) {
            if (!Array.isArray(items)) return [];
            return items.map(function (item) {
                return {
                    ...item,
                    read: !!item.read,
                    time: item.time || new Date().toISOString()
                };
            });
        }, []);

        updateJSON("jobs", function (items) {
            if (!Array.isArray(items)) return [];
            return items.map(function (item) {
                if (!item) return item;
                return {
                    ...item,
                    id: item.id !== undefined && item.id !== null ? String(item.id) : item.id
                };
            });
        }, []);
    }

    function runMigrations() {
        const meta = readMeta();
        let version = meta.version;

        if (version < 1) {
            migrateToV1();
            version = 1;
            writeMeta(version);
        }

        if (version < CURRENT_VERSION) {
            writeMeta(CURRENT_VERSION);
        }
    }

    function patchLocalStorageMethods() {
        if (Storage.prototype.__storageServicePatched) return;
        Storage.prototype.__storageServicePatched = true;

        Storage.prototype.getItem = function (key) {
            return readRaw(String(key));
        };

        Storage.prototype.setItem = function (key, value) {
            writeRaw(String(key), String(value));
        };

        Storage.prototype.removeItem = function (key) {
            removeRaw(String(key));
        };

        Storage.prototype.clear = function () {
            clearRaw();
        };
    }

    runMigrations();
    patchLocalStorageMethods();

    return {
        version: CURRENT_VERSION,
        getItem: readRaw,
        setItem: writeRaw,
        removeItem: removeRaw,
        clear: clearRaw,
        getJSON: getJSON,
        setJSON: setJSON,
        updateJSON: updateJSON,
        isUsingMemoryFallback: function () {
            return useMemoryFallback;
        }
    };
})();

window.storageService = window.StorageService;
