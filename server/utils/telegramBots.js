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
  telegramAuthHashMatches
};
