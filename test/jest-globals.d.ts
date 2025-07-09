import '@jest/globals';
declare global {
  const beforeAll: typeof import('@jest/globals').beforeAll;
  const afterAll: typeof import('@jest/globals').afterAll;
  const beforeEach: typeof import('@jest/globals').beforeEach;
  const afterEach: typeof import('@jest/globals').afterEach;
  const it: typeof import('@jest/globals').it;
  const expect: typeof import('@jest/globals').expect;
  const describe: typeof import('@jest/globals').describe;
}
export {};
