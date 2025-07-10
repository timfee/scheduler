import "tsconfig-paths/register";
import { jest, beforeAll, afterAll, afterEach } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from 'node:stream/web';
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).TextDecoder = TextDecoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).ReadableStream = ReadableStream;
const { fetch, ProxyAgent, setGlobalDispatcher, Response } = await import("undici");
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).Response = Response;
const { setupServer } = await import("msw/node");

export const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Next.js modules
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
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
