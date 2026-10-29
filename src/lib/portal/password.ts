import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function checkPassword(password: string, hash: string) {
  try {
    const [algorithm, salt, key] = hash.split(':');
    if (algorithm !== 'scrypt' || !salt || !key) return false;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(key, 'hex');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
