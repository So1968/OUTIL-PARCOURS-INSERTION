function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStorageItem(key, fallback = "") {
  try {
    return getStorage()?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function readStorageJson(key, fallback) {
  const value = readStorageItem(key, "");

  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStorageItem(key, value) {
  try {
    getStorage()?.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

export function writeStorageJson(key, value) {
  try {
    return writeStorageItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function removeStorageItem(key) {
  try {
    getStorage()?.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
