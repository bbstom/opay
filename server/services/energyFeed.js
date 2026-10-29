const TelegramGroup = require('../models/TelegramGroup');
const { getBotInstance } = require('../bot/MultiBotManager');

const pad = (n) => String(n).padStart(2, '0');

// 前 8 + 后 10，对齐群公告样例
const maskTronAddress = (addr) => {
  const s = String(addr || '').trim();
  if (s.length < 20) return s || '-';
  return `${s.slice(0, 8)} ***** ${s.slice(-10)}`;
};

const formatTradeTime = (date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(new Date(date || Date.now()));
  const g = (type) => parts.find((p) => p.type === type)?.value || pad(0);
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
};

const buildEnergyFeedText = ({ energyAmount, receiveAddress, sendAddress, at }) =>
  [
    '💍交易类别：能量租赁',
    `⏱️交易时间：${formatTradeTime(at)}`,
    `交易能量：${Number(energyAmount) || 0}`,
    `✅接收地址：${maskTronAddress(receiveAddress)}`,
    `🅾️发送地址：${maskTronAddress(sendAddress)}`
  ].join('\n');

const notifyEnergyRental = async (payload) => {
  const groups = await TelegramGroup.find({
    active: true,
    energyFeed: true,
    botStatus: { $ne: 'left' }
  }).select('chatId title').lean();

  if (!groups.length) return { sent: 0, failed: 0 };

  const botInstance = getBotInstance();
  if (!botInstance?.bot?.telegram) {
    console.warn('⚠️  能量群公告跳过：Bot 未启动');
    return { sent: 0, failed: 0 };
  }

  const text = buildEnergyFeedText(payload);
  let sent = 0;
  let failed = 0;

  for (const group of groups) {
    try {
      await botInstance.bot.telegram.sendMessage(group.chatId, text);
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`能量群公告失败 ${group.title || group.chatId}:`, err.message);
    }
  }

  if (sent || failed) {
    console.log(`📢 能量群公告 成功 ${sent} / 失败 ${failed}`);
  }
  return { sent, failed };
};

module.exports = {
  maskTronAddress,
  formatTradeTime,
  buildEnergyFeedText,
  notifyEnergyRental
};
