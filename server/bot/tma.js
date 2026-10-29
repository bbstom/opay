const { Markup } = require('telegraf');

/** TMA_USDT_DEMO 回退点：环境变量设为 0 后重启即回到对话下单 */
const isTmaUsdtDemoEnabled = () => String(process.env.TMA_USDT_DEMO || '1') !== '0';

const PRIVATE_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

const publicHttpsOrigin = (raw) => {
  let value = String(raw || '').trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (PRIVATE_HOSTS.has(url.hostname) || url.hostname.endsWith('.local')) return '';
    return `https://${url.host}`;
  } catch {
    return '';
  }
};

const tmaPayUrl = (settings) => {
  const origin =
    publicHttpsOrigin(process.env.TMA_URL) ||
    publicHttpsOrigin(process.env.PUBLIC_URL) ||
    publicHttpsOrigin(process.env.FRONTEND_URL) ||
    publicHttpsOrigin(process.env.SITE_URL) ||
    publicHttpsOrigin(process.env.APP_URL) ||
    publicHttpsOrigin(settings && settings.paymentNotifyUrl);
  return origin ? `${origin}/tma/pay` : '';
};

const getUsdtTmaKeyboard = (url) =>
  Markup.inlineKeyboard([
    [Markup.button.webApp('打开 USDT 代付', url)],
    [Markup.button.callback('对话里下单', 'payment_usdt_chat')],
    [Markup.button.callback('« 返回主菜单', 'back_to_main')]
  ]);

module.exports = {
  isTmaUsdtDemoEnabled,
  tmaPayUrl,
  getUsdtTmaKeyboard
};
