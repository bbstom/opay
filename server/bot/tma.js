const { Markup } = require('telegraf');

/** TMA_USDT_DEMO 回退点：环境变量设为 0 后重启即回到对话下单 */
const isTmaUsdtDemoEnabled = () => String(process.env.TMA_USDT_DEMO || '1') !== '0';

const tmaPayUrl = () => {
  const base = String(process.env.APP_URL || '').trim().replace(/\/$/, '');
  if (!/^https:\/\//i.test(base)) return '';
  return `${base}/tma/pay`;
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
