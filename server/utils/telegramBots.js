const crypto = require('crypto');

const parseTelegramBots = (raw) => {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeBotUsername = (raw) => String(raw || '').trim().replace(/^@+/, '');

const normalizeTelegramBots = (raw) =>
  parseTelegramBots(raw).map((bot, index) => ({
    id: String(bot.id || `bot-${index + 1}`),
    username: normalizeBotUsername(bot.username),
    token: typeof bot.token === 'string' ? bot.token.trim() : '',
    enabled: bot.enabled !== false
  }));

const redactTelegramBots = (raw) => {
  const asString = typeof raw === 'string';
  const redacted = normalizeTelegramBots(raw).map(({ token, ...rest }) => ({
    ...rest,
    token: '',
    hasToken: !!token
  }));
  return asString ? JSON.stringify(redacted) : redacted;
};

const mergeTelegramBots = (existingRaw, incomingRaw) => {
  if (incomingRaw === undefined || incomingRaw === null) return existingRaw;
  const oldBots = normalizeTelegramBots(existingRaw);
  const byId = Object.fromEntries(oldBots.map((bot) => [bot.id, bot]));
  const byName = Object.fromEntries(
    oldBots.filter((bot) => bot.username).map((bot) => [bot.username.toLowerCase(), bot])
  );
  const merged = normalizeTelegramBots(incomingRaw).map((bot) => {
    const prev = byId[bot.id] || byName[bot.username.toLowerCase()] || {};
    return {
      ...bot,
      token: bot.token || prev.token || ''
    };
  });
  return typeof incomingRaw === 'string' || typeof existingRaw === 'string'
    ? JSON.stringify(merged)
    : merged;
};

const getEnabledTelegramBots = (settings) =>
  normalizeTelegramBots(settings && settings.telegramBots).filter((bot) => bot.enabled && bot.token);

const getPrimaryTelegramBot = (settings) => getEnabledTelegramBots(settings)[0] || null;

const fingerprintTelegramBots = (raw) =>
  JSON.stringify(normalizeTelegramBots(raw).map((bot) => [bot.id, bot.username, bot.enabled, bot.token]));

const hmacTelegramPayload = (payload, botToken) => {
  const checkString = Object.keys(payload)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  return crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
};

const telegramAuthHashMatches = (payload, tokens) =>
  (tokens || []).some((token) => token && hmacTelegramPayload(payload, token) === payload.hash);

const timingSafeEqualHex = (left, right) => {
  if (!left || !right || left.length !== right.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
  } catch {
    return false;
  }
};

const parseTelegramInitData = (initData) => {
  const params = new URLSearchParams(String(initData || ''));
  const hash = params.get('hash') || '';
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  let user = null;
  try {
    const raw = params.get('user');
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }
  return {
    hash,
    dataCheckString,
    user,
    authDate: Number(params.get('auth_date') || 0)
  };
};

const hmacTelegramWebApp = (dataCheckString, botToken) => {
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
};

const telegramWebAppHashMatches = (initData, tokens) => {
  const parsed = parseTelegramInitData(initData);
  if (!parsed.hash) return { ok: false, parsed };
  const ok = (tokens || []).some(
    (token) => token && timingSafeEqualHex(hmacTelegramWebApp(parsed.dataCheckString, token), parsed.hash)
  );
  return { ok, parsed };
};

module.exports = {
  parseTelegramBots,
  normalizeBotUsername,
  normalizeTelegramBots,
  redactTelegramBots,
  mergeTelegramBots,
  getEnabledTelegramBots,
  getPrimaryTelegramBot,
  fingerprintTelegramBots,
  hmacTelegramPayload,
  telegramAuthHashMatches,
  parseTelegramInitData,
  telegramWebAppHashMatches
};
