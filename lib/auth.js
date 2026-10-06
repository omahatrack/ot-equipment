import crypto from 'node:crypto';
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expected] = stored.split(':');
  const actual = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  const a = Buffer.from(actual, 'hex'), b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function signSession(payload, secret) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 14*24*60*60*1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function verifySession(token, secret) {
  try {
    if (!token) return null;
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (!sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}
