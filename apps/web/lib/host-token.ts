function hostTokenStorageKey(roomId: string) {
  return `overtime:host:${roomId}`;
}

export function storeHostToken(roomId: string, hostToken: string) {
  localStorage.setItem(hostTokenStorageKey(roomId), hostToken);
}

export function getStoredHostToken(roomId: string): string | null {
  return localStorage.getItem(hostTokenStorageKey(roomId));
}
