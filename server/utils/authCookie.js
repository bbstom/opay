const { isProduction } = require('./env');
const { signToken, verifyToken } = require('./jwt');

const SID_COOKIE = 'ep_sid';
const PENDING_COOKIE = 'ep_2fa';
const SID_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PENDING_MAX_AGE_MS = 5 * 60 * 1000;

const parseCookieHeader = (header) => {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
};

const cookieOptions = (req, maxAge) => {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const sameSite = String(process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const secure = sameSite === 'none' || isProduction() || req.secure || proto === 'https';
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge
  };
};

const setCookie = (res, req, name, value, maxAge) => {
  res.cookie(name, value, cookieOptions(req, maxAge));
};

const clearCookie = (res, req, name) => {
  res.clearCookie(name, cookieOptions(req, 0));
};

const setAuthCookie = (res, req, token) => {
  setCookie(res, req, SID_COOKIE, token, SID_MAX_AGE_MS);
  clearCookie(res, req, PENDING_COOKIE);
};

const clearAuthCookie = (res, req) => {
  clearCookie(res, req, SID_COOKIE);
  clearCookie(res, req, PENDING_COOKIE);
};

const setPendingTwoFactor = (res, req, user) => {
  const token = signToken(
    { userId: user._id, purpose: '2fa' },
    { expiresIn: '5m' }
  );
  setCookie(res, req, PENDING_COOKIE, token, PENDING_MAX_AGE_MS);
};

const readPendingTwoFactor = (req) => {
  const cookies = parseCookieHeader(req.headers.cookie);
  const raw = cookies[PENDING_COOKIE];
  if (!raw) return null;
  try {
    const payload = verifyToken(raw);
    if (payload.purpose !== '2fa' || !payload.userId) return null;
    return payload;
  } catch {
    return null;
  }
};

const readAuthToken = (req) => {
  const cookies = parseCookieHeader(req.headers.cookie);
  if (cookies[SID_COOKIE]) return cookies[SID_COOKIE];
  const header = req.header('Authorization') || '';
  return header.replace(/^Bearer\s+/i, '').trim();
};

module.exports = {
  SID_COOKIE,
  setAuthCookie,
  clearAuthCookie,
  setPendingTwoFactor,
  readPendingTwoFactor,
  readAuthToken
};
