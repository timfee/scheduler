import "tsconfig-paths/register";

import { fetch, ProxyAgent, setGlobalDispatcher } from "undici";

if (process.env.USE_UNDICI_PROXY !== "false") {
  const proxy = process.env.https_proxy ?? process.env.http_proxy;
  if (proxy) {
    setGlobalDispatcher(new ProxyAgent({ uri: proxy }));
  }
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
}

// Provide a default encryption key for tests
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = "a".repeat(64);
}

// Use a valid NODE_ENV for envin validation
process.env.NODE_ENV = "development";
