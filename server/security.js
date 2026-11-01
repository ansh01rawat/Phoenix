const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isPermittedLocalOrigin(value) {
  if (typeof value !== 'string' || value === 'null') return false;
  try {
    const origin = new URL(value);
    return origin.protocol === 'http:' && localHosts.has(origin.hostname.toLowerCase());
  } catch {
    return false;
  }
}
