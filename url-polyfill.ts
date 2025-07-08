import { URL } from 'node:url';
import * as nodeUrl from 'node:url';

const originalParse = nodeUrl.parse;

(nodeUrl as any).parse = function(urlStr: string, parseQueryString?: boolean) {
  try {
    const base = urlStr.startsWith('http') ? undefined : 'http://localhost';
    const u = new URL(urlStr, base);
    const result: any = {
      href: u.href,
      protocol: u.protocol,
      slashes: true,
      host: u.host,
      auth: u.username ? `${u.username}${u.password ? ':' + u.password : ''}` : null,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      query: parseQueryString ? Object.fromEntries(u.searchParams.entries()) : u.search.replace(/^\?/, ''),
      hash: u.hash,
      path: u.pathname + u.search,
    };
    return result;
  } catch {
    return originalParse(urlStr, parseQueryString);
  }
};
