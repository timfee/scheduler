import "tsconfig-paths/register";
import { jest, beforeAll, afterAll, afterEach } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream, TransformStream } from 'node:stream/web';
import { MessageChannel, MessagePort } from 'worker_threads';
import '@testing-library/jest-dom';

// Set environment variables for tests
process.env.NODE_ENV = "test";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.SQLITE_PATH = ":memory:";
process.env.WEBHOOK_SECRET = "test-webhook-secret-that-is-long-enough-to-meet-requirements";

// polyfill web APIs for test environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).TextDecoder = TextDecoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).ReadableStream = ReadableStream;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).TransformStream = TransformStream;
// polyfill MessageChannel/MessagePort used by undici
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).MessageChannel = MessageChannel;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).MessagePort = MessagePort;

const { fetch, ProxyAgent, setGlobalDispatcher, Response, Request, Headers } = require("undici");
// Assign fetch globally so tests can perform network requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).fetch = fetch as unknown as typeof globalThis.fetch;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).Response = Response;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).Request = Request;
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(globalThis as any).Headers = Headers;

const { setupServer } = require("msw/node");

export const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Next.js modules
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
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
