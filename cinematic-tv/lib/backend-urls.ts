let backendIndex = 0;

export function getBackendUrls(): string[] {
  const raw = process.env.BACKEND_URLS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getNextBackendUrl(): string | null {
  const urls = getBackendUrls();
  if (!urls.length) return null;
  const url = urls[backendIndex % urls.length];
  backendIndex += 1;
  return url;
}

export function rotateBackendOnFailure(): string | null {
  return getNextBackendUrl();
}
