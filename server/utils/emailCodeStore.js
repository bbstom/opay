const crypto = require('crypto');

// 邮箱验证码：进程内短时凭证，不落库。按用途隔离，避免注册/重置互相覆盖。
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const store = new Map();

const norm = (email) => String(email || '').trim().toLowerCase();

const keyOf = (email, purpose = 'register') => `${purpose}:${norm(email)}`;

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

const hashesEqual = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const put = (email, code, purpose = 'register') => {
  const key = keyOf(email, purpose);
  store.set(key, {
    hash: hashCode(code),
    expiresAt: Date.now() + CODE_TTL_MS,
    sentAt: Date.now(),
    attempts: 0
  });
};

const canSend = (email, purpose = 'register') => {
  const rec = store.get(keyOf(email, purpose));
  if (!rec) return { ok: true, waitMs: 0 };
  const waitMs = RESEND_MS - (Date.now() - rec.sentAt);
  if (waitMs > 0) return { ok: false, waitMs };
  return { ok: true, waitMs: 0 };
};

const verify = (email, code, purpose = 'register') => {
  const key = keyOf(email, purpose);
  const rec = store.get(key);
  if (!rec) return false;
  if (rec.expiresAt < Date.now()) {
    store.delete(key);
    return false;
  }
  rec.attempts += 1;
  if (rec.attempts > MAX_ATTEMPTS) {
    store.delete(key);
    return false;
  }
  return hashesEqual(rec.hash, hashCode(code));
};

const consume = (email, purpose = 'register') => {
  store.delete(keyOf(email, purpose));
};

const makeCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

module.exports = { put, canSend, verify, consume, makeCode, CODE_TTL_MS, RESEND_MS };
