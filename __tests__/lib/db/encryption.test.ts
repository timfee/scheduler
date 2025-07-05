let encrypt: (text: string) => string;
let decrypt: (text: string) => string;

beforeAll(async () => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  ({ encrypt, decrypt } = await import('@/lib/db/encryption'));
});

describe('encryption utilities', () => {
  it('encrypts and decrypts text symmetrically', () => {
    const text = 'secret-data';
    const encrypted = encrypt(text);
    expect(encrypted).toEqual(expect.any(String));
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });
});
