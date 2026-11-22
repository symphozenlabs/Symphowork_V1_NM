import manifest from './api-manifest.json';
export const SESSION_COOKIE = 'symphowork_session';
const routes = [...manifest].sort((a,b) => {
  const left=a.route.split('/'),right=b.route.split('/');
  for(let i=0;i<Math.min(left.length,right.length);i++) {
    if(left[i].startsWith('[')!==right[i].startsWith('[')) return left[i].startsWith('[')?1:-1;
  }
  return right.length-left.length;
});
export function allowedMethods(path: string): string[] {
  if (!path.startsWith('/api/') || /%(2f|5c|2e)|\\\\/i.test(path)) return [];
  const segments = path.split('/');
  const rule = routes.find((entry) => {
    const pattern = entry.route.split('/');
    return pattern.length === segments.length && pattern.every((part, i) =>
      part.startsWith('[') ? Boolean(segments[i]) : part === segments[i]);
  });
  return rule?.methods ?? [];
}
export function allowsRequest(path: string, method: string): boolean {
  const methods = allowedMethods(path);
  return methods.includes(method) || method === 'HEAD' && methods.includes('GET');
}
export function sameOriginMutation(request: Request, origin: string): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
  const declared = request.headers.get('origin');
  return (!declared || declared === origin) && request.headers.get('sec-fetch-site') !== 'cross-site';
}
export function upstreamOrigin(value: string | undefined, selfOrigin?: string): URL {
  if (!value) throw new Error('The legacy backend is not configured.');
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      !['http:', 'https:'].includes(url.protocol) ||
      url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.origin === selfOrigin) throw new Error('The legacy backend configuration is invalid.');
  return url;
}
export function sessionCookie(request: Request): string {
  const value = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(SESSION_COOKIE + '='));
  return value ?? '';
}

