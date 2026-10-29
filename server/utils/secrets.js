const { redactTelegramBots, mergeTelegramBots } = require('./telegramBots');

const SECRET_FIELDS = ['smtpPass', 'catfeeApiKey'];

const flagName = (field) => `has${field.charAt(0).toUpperCase()}${field.slice(1)}`;

const parseNodes = (raw) => {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const redactTronApiNodes = (raw) => {
  const asString = typeof raw === 'string';
  const nodes = parseNodes(raw);
  const redacted = nodes.map(({ apiKey, ...rest }) => ({
    ...rest,
    apiKey: '',
    hasApiKey: !!apiKey
  }));
  return asString ? JSON.stringify(redacted) : redacted;
};

const mergeTronApiNodes = (existingRaw, incomingRaw) => {
  const oldNodes = parseNodes(existingRaw);
  const nextNodes = parseNodes(incomingRaw);
  if (!incomingRaw) return existingRaw;
  const byKey = Object.fromEntries(
    oldNodes.map((n) => [String(n.url || n.name || ''), n])
  );
  const merged = nextNodes.map((n) => {
    const prev = byKey[String(n.url || n.name || '')] || {};
    const incomingKey = typeof n.apiKey === 'string' ? n.apiKey.trim() : '';
    return {
      ...n,
      apiKey: incomingKey || prev.apiKey || ''
    };
  });
  return typeof incomingRaw === 'string' || typeof existingRaw === 'string'
    ? JSON.stringify(merged)
    : merged;
};

const redactSettings = (settings) => {
  const obj = settings && settings.toObject ? settings.toObject() : { ...settings };
  delete obj.tronPrivateKeyEncrypted;
  delete obj.privateKeyEncrypted;
  SECRET_FIELDS.forEach((field) => {
    obj[flagName(field)] = !!obj[field];
    obj[field] = '';
  });
  if (obj.tronApiNodes) {
    obj.tronApiNodes = redactTronApiNodes(obj.tronApiNodes);
  }
  if (obj.telegramBots) {
    obj.telegramBots = redactTelegramBots(obj.telegramBots);
  }
  return obj;
};

const keepIfBlank = (incoming, existing) => {
  if (incoming === undefined || incoming === null) return existing;
  if (typeof incoming === 'string' && incoming.trim() === '') return existing;
  return incoming;
};

const mergeSettingSecrets = (existing, incoming) => {
  const next = { ...incoming };
  SECRET_FIELDS.forEach((field) => {
    if (field in next) {
      next[field] = keepIfBlank(next[field], existing[field]);
    }
  });
  if (next.tronApiNodes) {
    next.tronApiNodes = mergeTronApiNodes(existing.tronApiNodes, next.tronApiNodes);
  }
  if (next.telegramBots) {
    next.telegramBots = mergeTelegramBots(existing.telegramBots, next.telegramBots);
  }
  return next;
};

module.exports = {
  redactSettings,
  mergeSettingSecrets,
  mergeTronApiNodes,
  redactTronApiNodes
};
