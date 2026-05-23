window.StorageService = (function () {
    const STORAGE_META_KEY = "__storage_meta__";
    const CURRENT_VERSION = 1;
    const STORAGE_SYNC_ENDPOINT = "api/storage";

    const nativeGetItem = Storage.prototype.getItem;
    const nativeSetItem = Storage.prototype.setItem;
    const nativeRemoveItem = Storage.prototype.removeItem;
    const nativeClear = Storage.prototype.clear;
    const nativeKey = Storage.prototype.key;

    const memoryStore = {};
    let useMemoryFallback = false;
    let remoteEnabled = false;
    let remoteSyncInProgress = false;
    let remotePushTimer = null;
    let remoteHasPendingPush = false;

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
        Object.keys(memoryStore).forEach(function (key) {
            delete memoryStore[key];
        });
    }

    function hydrateMemoryFromBrowserStorage() {
        if (useMemoryFallback) return;
        safeCall(function () {
            memoryClear();
            const length = window.localStorage.length;
            for (let i = 0; i < length; i++) {
                const key = nativeKey.call(window.localStorage, i);
                if (key === null) continue;
                const value = nativeGetItem.call(window.localStorage, key);
                if (value !== null) {
                    memorySet(key, value);
                }
            }
        });
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
            queueRemotePush();
            return;
        }
        safeCall(function () {
            nativeSetItem.call(window.localStorage, key, String(value));
            memorySet(key, value);
        });
        queueRemotePush();
    }

    function removeRaw(key) {
        if (useMemoryFallback) {
            memoryRemove(key);
            queueRemotePush();
            return;
        }
        safeCall(function () {
            nativeRemoveItem.call(window.localStorage, key);
            memoryRemove(key);
        });
        queueRemotePush();
    }

    function clearRaw() {
        if (useMemoryFallback) {
            memoryClear();
            queueRemotePush();
            return;
        }
        safeCall(function () {
            nativeClear.call(window.localStorage);
            memoryClear();
        });
        queueRemotePush();
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

    function buildSnapshotPayload() {
        const payload = {};
        Object.keys(memoryStore).forEach(function (key) {
            payload[key] = String(memoryStore[key]);
        });
        return payload;
    }

    function queueRemotePush() {
        if (!remoteEnabled) return;
        if (remotePushTimer) {
            clearTimeout(remotePushTimer);
        }
        remotePushTimer = setTimeout(function () {
            remotePushTimer = null;
            pushSnapshotToServer();
        }, 200);
    }

    function pushSnapshotToServer() {
        if (!remoteEnabled) return;
        if (remoteSyncInProgress) {
            remoteHasPendingPush = true;
            return;
        }
        remoteSyncInProgress = true;
        const payload = JSON.stringify(buildSnapshotPayload());
        fetch(STORAGE_SYNC_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        })
            .catch(function () {
                remoteEnabled = false;
            })
            .finally(function () {
                remoteSyncInProgress = false;
                if (remoteHasPendingPush) {
                    remoteHasPendingPush = false;
                    queueRemotePush();
                }
            });
    }

    const RECRUITMENT_STORAGE_KEYS = [
        "recruitmentBatches",
        "jobs",
        "applications",
        "recruitmentAuditLog"
    ];

    function mergeJsonArraysById(localStr, remoteStr, idField) {
        try {
            const local = JSON.parse(localStr || "[]");
            const remote = JSON.parse(remoteStr || "[]");
            if (!Array.isArray(local) || !Array.isArray(remote)) {
                return localStr || remoteStr;
            }
            const map = {};
            remote.forEach(function (item) {
                if (item && item[idField] != null) {
                    map[String(item[idField])] = item;
                }
            });
            local.forEach(function (item) {
                if (item && item[idField] != null) {
                    map[String(item[idField])] = item;
                }
            });
            return JSON.stringify(Object.keys(map).map(function (k) {
                return map[k];
            }));
        } catch (error) {
            return localStr || remoteStr;
        }
    }

    function mergeRecruitmentStorage(localPreserved, remoteSnapshot) {
        RECRUITMENT_STORAGE_KEYS.forEach(function (key) {
            const localVal = localPreserved[key];
            const remoteVal = remoteSnapshot[key] != null ? String(remoteSnapshot[key]) : "";
            if (!localVal) {
                return;
            }
            if (!remoteVal) {
                writeRaw(key, localVal);
                return;
            }
            if (key === "recruitmentBatches") {
                writeRaw(key, mergeJsonArraysById(remoteVal, localVal, "id"));
                return;
            }
            if (key === "applications") {
                writeRaw(key, mergeJsonArraysById(remoteVal, localVal, "jobId"));
                return;
            }
            if (key === "jobs") {
                try {
                    const localArr = JSON.parse(localVal);
                    const remoteArr = JSON.parse(remoteVal);
                    if (Array.isArray(localArr) && Array.isArray(remoteArr) && localArr.length >= remoteArr.length) {
                        writeRaw(key, localVal);
                    }
                } catch (error) {
                    writeRaw(key, localVal);
                }
            }
        });
        setTimeout(function () {
            if (window.RecruitmentData && typeof RecruitmentData.refreshJobsCache === "function") {
                try {
                    RecruitmentData.refreshJobsCache();
                } catch (error) {}
            }
        }, 0);
    }

    function applyRemoteSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== "object") return;

        const localPreserved = {};
        RECRUITMENT_STORAGE_KEYS.forEach(function (key) {
            const value = readRaw(key);
            if (value) {
                localPreserved[key] = value;
            }
        });

        const localHasRecruitment = !!localPreserved.recruitmentBatches;
        const remoteHasRecruitment = snapshot.recruitmentBatches != null && String(snapshot.recruitmentBatches).length > 2;
        if (localHasRecruitment && !remoteHasRecruitment) {
            remoteEnabled = true;
            queueRemotePush();
            return;
        }

        memoryClear();
        if (!useMemoryFallback) {
            safeCall(function () {
                nativeClear.call(window.localStorage);
            });
        }
        Object.keys(snapshot).forEach(function (key) {
            const value = String(snapshot[key]);
            memorySet(key, value);
            if (!useMemoryFallback) {
                safeCall(function () {
                    nativeSetItem.call(window.localStorage, key, value);
                });
            }
        });

        if (Object.keys(localPreserved).length) {
            mergeRecruitmentStorage(localPreserved, snapshot);
        }
    }

    function bootstrapRemoteSync() {
        if (!window.fetch) return;
        console.log("[StorageService] Bootstrapping remote sync, endpoint:", STORAGE_SYNC_ENDPOINT, "full URL:", window.location.origin + window.location.pathname + STORAGE_SYNC_ENDPOINT);
        fetch(STORAGE_SYNC_ENDPOINT, {
            method: "GET",
            headers: { "Accept": "application/json" }
        })
            .then(function (response) {
                console.log("[StorageService] GET response status:", response.status);
                if (!response.ok) throw new Error("storage sync unavailable: status " + response.status);
                return response.text();
            })
            .then(function (text) {
                console.log("[StorageService] GET response body:", text);
                if (!text || !text.trim()) return {};
                return JSON.parse(text);
            })
            .then(function (snapshot) {
                applyRemoteSnapshot(snapshot);
                remoteEnabled = true;
                console.log("[StorageService] Remote sync enabled!");
                queueRemotePush();
            })
            .catch(function (error) {
                remoteEnabled = false;
                console.error("[StorageService] Remote sync failed:", error.message);
                hydrateMemoryFromBrowserStorage();
            });
    }

    hydrateMemoryFromBrowserStorage();
    runMigrations();
    patchLocalStorageMethods();
    bootstrapRemoteSync();

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
        },
        isRemoteEnabled: function () {
            return remoteEnabled;
        }
    };
})();

window.storageService = window.StorageService;
