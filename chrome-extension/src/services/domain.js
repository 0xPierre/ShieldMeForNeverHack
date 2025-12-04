/**
 * Domain detection service
 */
export function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch {
    return null;
  }
}

export function getBaseDomain(hostname) {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}
