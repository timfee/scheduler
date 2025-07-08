import { URL, type UrlWithParsedQuery, type UrlWithStringQuery } from 'node:url';
import * as nodeUrl from 'node:url';

const originalParse = nodeUrl.parse;

(nodeUrl as {
  parse: (
    urlStr: string,
    parseQueryString?: boolean,
  ) => UrlWithParsedQuery | UrlWithStringQuery;
}).parse = function (
  urlStr: string,
  parseQueryString?: boolean,
): UrlWithParsedQuery | UrlWithStringQuery {
  try {
    const base = urlStr.startsWith('http') ? undefined : 'http://localhost';
    const u = new URL(urlStr, base);
    const query = parseQueryString
      ? Object.fromEntries(u.searchParams.entries())
      : u.search.replace(/^\?/, '');
    const result = {
      href: u.href,
      protocol: u.protocol,
      slashes: true,
      host: u.host,
      auth: u.username ? `${u.username}${u.password ? `:${u.password}` : ''}` : null,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      query,
      hash: u.hash,
      path: `${u.pathname}${u.search}`,
    };
    return result as UrlWithParsedQuery | UrlWithStringQuery;
  } catch {
    return originalParse(urlStr, parseQueryString ?? false) as
      | UrlWithParsedQuery
      | UrlWithStringQuery;
  }
};
