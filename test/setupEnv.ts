import "tsconfig-paths/register";
import { jest, beforeAll, afterAll, afterEach } from "@jest/globals";
import { fetch, ProxyAgent, setGlobalDispatcher } from "undici";
import { setupServer } from "msw/node";

export const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Next.js modules
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Setup proxy if needed
if (process.env.USE_UNDICI_PROXY !== "false") {
  const proxy = process.env.https_proxy ?? process.env.http_proxy;
  if (proxy) {
    setGlobalDispatcher(new ProxyAgent({ uri: proxy }));
  }
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
}
