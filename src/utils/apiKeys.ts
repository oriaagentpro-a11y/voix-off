export interface ApiKeyEntry { id: string; label: string; key: string; enabled: boolean; }
const STORE = "voxstudio_api_keys";

export const loadKeys = (): ApiKeyEntry[] => {
  try { const v = JSON.parse(localStorage.getItem(STORE) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
};
export const saveKeys = (keys: ApiKeyEntry[]) => {
  localStorage.setItem(STORE, JSON.stringify(keys));
  window.dispatchEvent(new Event("voxstudio-keys"));
};
export const activeKeys = () => loadKeys().filter((k) => k.enabled && k.key.trim()).map((k) => k.key.trim());

/* fetch qui joint les clés actives ; le serveur les essaie tour à tour (rotation + repli). */
export const apiFetch = (input: string, init: RequestInit = {}) => {
  const keys = activeKeys();
  const headers = new Headers(init.headers);
  if (keys.length) headers.set("x-gemini-api-keys", btoa(JSON.stringify(keys)));
  return fetch(input, { ...init, headers });
};
