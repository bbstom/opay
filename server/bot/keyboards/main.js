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

// 主菜单键盘（从数据库读取配置）
async function getMainKeyboard() {
  try {
    const menu = await TelegramMenu.findOne({ name: 'main_menu', enabled: true });
    
    if (!menu || !menu.buttons || menu.buttons.length === 0) {
      // 使用默认菜单
      return getDefaultMainKeyboard();
    }

    const sourceButtons = withRewardMenuButtons(menu.buttons);

    // 按行分组按钮
    const rows = {};
    sourceButtons
      .filter(btn => btn.enabled)
      .sort((a, b) => a.order - b.order)
      .forEach(btn => {
        if (!rows[btn.row]) rows[btn.row] = [];
        rows[btn.row].push(btn);
      });

    // 构建按钮数组
    const buttons = Object.keys(rows)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(row => {
        return rows[row]
          .sort((a, b) => a.col - b.col)
          .map(btn => {
            if (btn.type === 'url') {
              return Markup.button.url(btn.text, btn.action);
            } else {
              return Markup.button.callback(btn.text, btn.action);
            }
          });
      });

    return Markup.inlineKeyboard(buttons);
  } catch (error) {
    console.error('获取主菜单失败:', error);
    return getDefaultMainKeyboard();
  }
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
  getMainKeyboard,
  getPaymentMethodKeyboard,
  getConfirmKeyboard,
  getBackKeyboard,
  getOrdersKeyboard,
  getOrderDetailKeyboard,
  getStatusEmoji,
  withRewardInlineRow
};
