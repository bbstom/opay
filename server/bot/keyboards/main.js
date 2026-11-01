const { Markup } = require('telegraf');
const TelegramMenu = require('../../models/TelegramMenu');

const REWARD_MENU_BUTTONS = [
  { text: '📅 签到', type: 'system', action: 'reward_checkin' },
  { text: '🎁 邀请', type: 'system', action: 'reward_invite' },
  { text: '💸 提现', type: 'system', action: 'reward_withdraw' }
];

function withRewardMenuButtons(buttons = []) {
  const actions = new Set(buttons.map((btn) => btn.action));
  if (REWARD_MENU_BUTTONS.every((btn) => actions.has(btn.action))) {
    return buttons;
  }
  const maxRow = buttons.reduce((max, btn) => Math.max(max, Number(btn.row) || 0), -1);
  const extras = REWARD_MENU_BUTTONS
    .filter((btn) => !actions.has(btn.action))
    .map((btn, index) => ({
      ...btn,
      row: maxRow + 1,
      col: index,
      order: 900 + index,
      enabled: true,
      showInSlash: true
    }));
  return buttons.concat(extras);
}

function withRewardInlineRow(replyMarkup) {
  if (!replyMarkup?.inline_keyboard) return replyMarkup;
  const rows = replyMarkup.inline_keyboard;
  const has = (data) => rows.some((row) => row.some((btn) => btn.callback_data === data));
  if (has('reward_checkin') && has('reward_invite') && has('reward_withdraw')) {
    return replyMarkup;
  }
  return {
    ...replyMarkup,
    inline_keyboard: rows.concat([[
      { text: '📅 签到', callback_data: 'reward_checkin' },
      { text: '🎁 邀请', callback_data: 'reward_invite' },
      { text: '💸 提现', callback_data: 'reward_withdraw' }
    ]])
  };
}

const DEFAULT_MENU_BUTTONS = [
  { text: '💰 USDT 代付', type: 'system', action: 'payment_usdt', row: 0, col: 0, order: 0, enabled: true, showInSlash: true },
  { text: '💎 TRX 代付', type: 'system', action: 'payment_trx', row: 0, col: 1, order: 1, enabled: true, showInSlash: true },
  { text: '⚡ 能量租赁', type: 'system', action: 'energy_rental', row: 1, col: 0, order: 2, enabled: true, showInSlash: true },
  { text: '🔄 闪兑', type: 'system', action: 'swap_service', row: 1, col: 1, order: 3, enabled: true, showInSlash: true },
  { text: '📋 我的订单', type: 'system', action: 'orders_list', row: 2, col: 0, order: 4, enabled: true, showInSlash: true },
  { text: '💬 工单', type: 'system', action: 'tickets_list', row: 2, col: 1, order: 5, enabled: true, showInSlash: true },
  { text: '👤 个人中心', type: 'system', action: 'account_info', row: 3, col: 0, order: 6, enabled: true, showInSlash: true },
  { text: '❓ 帮助', type: 'system', action: 'help_center', row: 3, col: 1, order: 7, enabled: true, showInSlash: true },
  { text: '📅 签到', type: 'system', action: 'reward_checkin', row: 4, col: 0, order: 8, enabled: true, showInSlash: true },
  { text: '🎁 邀请', type: 'system', action: 'reward_invite', row: 4, col: 1, order: 9, enabled: true, showInSlash: true },
  { text: '💸 提现', type: 'system', action: 'reward_withdraw', row: 4, col: 2, order: 10, enabled: true, showInSlash: true }
];

function groupEnabledButtons(sourceButtons = []) {
  const rows = {};
  sourceButtons
    .filter((btn) => btn && btn.enabled !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .forEach((btn) => {
      const row = Number(btn.row) || 0;
      if (!rows[row]) rows[row] = [];
      rows[row].push(btn);
    });
  return Object.keys(rows)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((row) => rows[row].sort((a, b) => (Number(a.col) || 0) - (Number(b.col) || 0)));
}

async function loadMenuButtons() {
  try {
    const menu = await TelegramMenu.findOne({ name: 'main_menu', enabled: true });
    if (menu?.buttons?.length) {
      return withRewardMenuButtons(menu.buttons);
    }
  } catch (error) {
    console.error('获取主菜单失败:', error);
  }
  return DEFAULT_MENU_BUTTONS;
}

const DOCK_MENU_TEXT = '📋 菜单';

function getDockKeyboard() {
  let extra = Markup.keyboard([[DOCK_MENU_TEXT]]).resize();
  if (typeof extra.persistent === 'function') extra = extra.persistent();
  return extra;
}

function isDockMenuText(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (value === DOCK_MENU_TEXT || value === '菜单') return true;
  return /^\/menu(@\w+)?$/i.test(value);
}

function toReplyKeyboard(sourceButtons) {
  const rows = groupEnabledButtons(sourceButtons);
  const keyboard = rows.map((row) => row.map((btn) => Markup.button.text(btn.text)));
  const extra = Markup.keyboard(keyboard.length ? keyboard : [[DOCK_MENU_TEXT]]).resize();
  return typeof extra.persistent === 'function' ? extra.persistent() : extra;
}

// 聊天输入框上方的常驻功能键（左下角那一排）
async function getMainReplyKeyboard() {
  try {
    return toReplyKeyboard(await loadMenuButtons());
  } catch (error) {
    console.error('获取底部菜单失败:', error);
    return toReplyKeyboard(DEFAULT_MENU_BUTTONS);
  }
}

// 消息下方 inline：只给某一步的确认/返回，不再当主菜单
async function getMainKeyboard() {
  try {
    const sourceButtons = await loadMenuButtons();
    const buttons = groupEnabledButtons(sourceButtons).map((row) =>
      row.map((btn) => {
        if (btn.type === 'url' || /^https?:\/\//i.test(String(btn.action || ''))) {
          return Markup.button.url(btn.text, btn.action);
        }
        return Markup.button.callback(btn.text, btn.action);
      })
    );
    return Markup.inlineKeyboard(buttons);
  } catch (error) {
    console.error('获取主菜单失败:', error);
    return getDefaultMainKeyboard();
  }
}

async function findMenuButtonByText(text) {
  const needle = String(text || '').trim();
  if (!needle) return null;
  const buttons = await loadMenuButtons();
  return buttons.find((btn) => btn.enabled !== false && String(btn.text || '').trim() === needle) || null;
}

// 默认主菜单（备用）
function getDefaultMainKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💰 USDT 代付', 'payment_usdt'),
      Markup.button.callback('💰 TRX 代付', 'payment_trx')
    ],
    [
      Markup.button.callback('⚡ 能量租赁', 'energy_rental'),
      Markup.button.callback('🔄 闪兑', 'swap_service')
    ],
    [
      Markup.button.callback('📋 我的订单', 'orders_list'),
      Markup.button.callback('💬 工单系统', 'tickets_list')
    ],
    [
      Markup.button.callback('👤 个人中心', 'account_info'),
      Markup.button.callback('❓ 帮助中心', 'help_center')
    ],
    [
      Markup.button.callback('📅 签到', 'reward_checkin'),
      Markup.button.callback('🎁 邀请', 'reward_invite'),
      Markup.button.callback('💸 提现', 'reward_withdraw')
    ]
  ]);
}

// 支付方式选择键盘
function getPaymentMethodKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💚 微信支付', 'pay_wechat'),
      Markup.button.callback('🔵 支付宝', 'pay_alipay')
    ],
    [Markup.button.callback('« 返回主菜单', 'back_to_main')]
  ]);
}

// 确认键盘
function getConfirmKeyboard(action) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ 确认', `confirm_${action}`),
      Markup.button.callback('❌ 取消', 'cancel')
    ]
  ]);
}

// 返回键盘
function getBackKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('« 返回主菜单', 'back_to_main')]
  ]);
}

// 订单列表键盘
function getOrdersKeyboard(orders) {
  const buttons = orders.slice(0, 5).map(order => [
    Markup.button.callback(
      `${order.payType} ${order.amount} - ${getStatusEmoji(order.status)}`,
      `order_detail_${order._id}`
    )
  ]);
  
  buttons.push([Markup.button.callback('« 返回主菜单', 'back_to_main')]);
  
  return Markup.inlineKeyboard(buttons);
}

// 订单详情键盘
function getOrderDetailKeyboard(orderId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 刷新状态', `order_refresh_${orderId}`)],
    [Markup.button.callback('« 返回订单列表', 'orders_list')]
  ]);
}

// 辅助函数：获取状态表情
function getStatusEmoji(status) {
  const statusMap = {
    'pending': '⏳',
    'paid': '💳',
    'processing': '🔄',
    'completed': '✅',
    'failed': '❌'
  };
  return statusMap[status] || '❓';
}

module.exports = {
  DOCK_MENU_TEXT,
  getDockKeyboard,
  isDockMenuText,
  getMainKeyboard,
  getMainReplyKeyboard,
  findMenuButtonByText,
  getPaymentMethodKeyboard,
  getConfirmKeyboard,
  getBackKeyboard,
  getOrdersKeyboard,
  getOrderDetailKeyboard,
  getStatusEmoji,
  withRewardInlineRow,
  withRewardMenuButtons,
  DEFAULT_MENU_BUTTONS
};
