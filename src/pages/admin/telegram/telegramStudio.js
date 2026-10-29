// 入口按钮 ↔ 斜杠指令：同一套业务，不要两套配置
export const ACTION_SLASH = {
  payment_usdt: { command: 'pay_usdt', description: 'USDT代付', functionName: 'pay_usdt' },
  payment_trx: { command: 'pay_trx', description: 'TRX代付', functionName: 'pay_trx' },
  energy_rental: { command: 'energy', description: '能量租赁', functionName: 'energy' },
  swap_service: { command: 'swap', description: '闪兑服务', functionName: 'swap' },
  orders_list: { command: 'orders', description: '我的订单', functionName: 'my_orders' },
  tickets_list: { command: 'tickets', description: '我的工单', functionName: 'tickets' },
  account_info: { command: 'account', description: '个人中心', functionName: 'account' },
  help_center: { command: 'help', description: '帮助信息', functionName: 'help' }
};

export const RECOMMENDED_MENU = [
  { text: '💰 USDT 代付', type: 'system', action: 'payment_usdt', row: 0, col: 0, order: 0, enabled: true, showInSlash: true },
  { text: '💎 TRX 代付', type: 'system', action: 'payment_trx', row: 0, col: 1, order: 1, enabled: true, showInSlash: true },
  { text: '⚡ 能量租赁', type: 'system', action: 'energy_rental', row: 1, col: 0, order: 2, enabled: true, showInSlash: true },
  { text: '🔄 闪兑', type: 'system', action: 'swap_service', row: 1, col: 1, order: 3, enabled: true, showInSlash: true },
  { text: '📋 我的订单', type: 'system', action: 'orders_list', row: 2, col: 0, order: 4, enabled: true, showInSlash: true },
  { text: '💬 工单', type: 'system', action: 'tickets_list', row: 2, col: 1, order: 5, enabled: true, showInSlash: true },
  { text: '👤 个人中心', type: 'system', action: 'account_info', row: 3, col: 0, order: 6, enabled: true, showInSlash: true },
  { text: '❓ 帮助', type: 'system', action: 'help_center', row: 3, col: 1, order: 7, enabled: true, showInSlash: true }
];

export const CORE_SCENES = [
  { key: 'welcome_new_user', title: '新用户第一次打开', when: '第一次 /start', group: '开场' },
  { key: 'welcome_returning_user', title: '老用户回来', when: '已有账号再 /start', group: '开场' },
  { key: 'main_menu', title: '主菜单说明', when: '回到主菜单', group: '开场' },
  { key: 'help_center', title: '帮助首页', when: '点帮助', group: '开场' },
  { key: 'help_faq', title: '常见问题', when: '帮助 → FAQ', group: '开场' },
  { key: 'help_contact', title: '联系客服', when: '帮助 → 客服', group: '开场' },
  { key: 'help_tutorial', title: '使用教程', when: '帮助 → 教程', group: '开场' },
  { key: 'payment_usdt_input', title: 'USDT：输入数量', when: '点 USDT 代付', group: '代付' },
  { key: 'payment_trx_input', title: 'TRX：输入数量', when: '点 TRX 代付', group: '代付' },
  { key: 'payment_usdt_order_detail', title: 'USDT：确认订单', when: '填完数量', group: '代付' },
  { key: 'payment_trx_order_detail', title: 'TRX：确认订单', when: '填完数量', group: '代付' },
  { key: 'payment_order_confirm', title: '确认支付', when: '提交代付', group: '代付' },
  { key: 'payment_select_method', title: '选支付方式', when: '选微信/支付宝', group: '代付' },
  { key: 'payment_qrcode', title: '收款码', when: '出示二维码', group: '代付' },
  { key: 'payment_success', title: '用户已付款', when: '支付成功通知', group: '代付' },
  { key: 'transfer_complete', title: '代付打出成功', when: '链上转出完成', group: '代付' },
  { key: 'transfer_failed', title: '代付打出失败', when: '转账失败通知', group: '代付' },
  { key: 'orders_list', title: '订单列表', when: '点我的订单', group: '订单' },
  { key: 'orders_empty', title: '还没有订单', when: '订单为空', group: '订单' },
  { key: 'order_detail', title: '订单详情', when: '点某一笔', group: '订单' },
  { key: 'order_completed', title: '订单完成', when: '整单完成', group: '订单' },
  { key: 'order_failed', title: '订单失败', when: '整单失败', group: '订单' },
  { key: 'energy_rental', title: '能量租赁', when: '点能量', group: '服务' },
  { key: 'swap_service', title: '闪兑', when: '点闪兑', group: '服务' },
  { key: 'tickets_list', title: '工单', when: '点工单', group: '账户' },
  { key: 'account_info', title: '个人中心', when: '点个人中心', group: '账户' }
];

// 底部按钮点下去后，编辑的是哪段回复
export const ACTION_SCENE = {
  payment_usdt: { key: 'payment_usdt_input', title: 'USDT 代付', category: 'payment' },
  payment_trx: { key: 'payment_trx_input', title: 'TRX 代付', category: 'payment' },
  energy_rental: { key: 'energy_rental', title: '能量租赁', category: 'custom' },
  swap_service: { key: 'swap_service', title: '闪兑', category: 'custom' },
  orders_list: { key: 'orders_list', title: '我的订单', category: 'order' },
  tickets_list: { key: 'tickets_list', title: '工单', category: 'custom' },
  account_info: { key: 'account_info', title: '个人中心', category: 'custom' },
  help_center: { key: 'help_center', title: '帮助', category: 'help' }
};

export const WELCOME_VERSIONS = [
  { id: 'new', key: 'welcome_new_user', title: '新用户', category: 'welcome' },
  { id: 'returning', key: 'welcome_returning_user', title: '老用户', category: 'welcome' }
];

export const VAR_ALWAYS = [
  { key: 'siteName', label: '网站名', group: '通用' },
  { key: 'username', label: '用户名', group: '通用' },
  { key: 'firstName', label: '称呼', group: '通用' },
  { key: 'telegramId', label: 'Telegram ID', group: '通用' },
  { key: 'email', label: '邮箱', group: '通用' },
  { key: 'websiteUrl', label: '网站地址', group: '通用' },
  { key: 'customerService', label: '客服', group: '通用' }
];

export const VAR_PAYMENT = [
  { key: 'minAmount', label: '最小数量', group: '代付' },
  { key: 'maxAmount', label: '最大数量', group: '代付' },
  { key: 'amount', label: '代付数量', group: '代付' },
  { key: 'type', label: '币种', group: '代付' },
  { key: 'payType', label: '代付类型', group: '代付' },
  { key: 'rate', label: '汇率', group: '代付' },
  { key: 'cnyAmount', label: '人民币金额', group: '代付' },
  { key: 'serviceFee', label: '服务费', group: '代付' },
  { key: 'feeLabel', label: '费率标签', group: '代付' },
  { key: 'totalCNY', label: '应付合计', group: '代付' },
  { key: 'address', label: '收款地址', group: '代付' },
  { key: 'paymentName', label: '支付方式', group: '代付' }
];

export const VAR_ORDER = [
  { key: 'orderId', label: '订单号', group: '订单' },
  { key: 'platformOrderId', label: '平台订单号', group: '订单' },
  { key: '_id', label: '订单内部ID', group: '订单' },
  { key: 'orderCount', label: '订单条数', group: '订单' },
  { key: 'orderList', label: '订单列表正文', group: '订单' },
  { key: 'paymentStatus', label: '支付状态', group: '订单' },
  { key: 'transferStatus', label: '代付状态', group: '订单' },
  { key: 'status', label: '总状态', group: '订单' },
  { key: 'createdAt', label: '创建/注册时间', group: '订单' },
  { key: 'paymentTime', label: '支付时间行', group: '订单' },
  { key: 'transferTime', label: '完成时间行', group: '订单' },
  { key: 'txHash', label: '交易哈希', group: '订单' },
  { key: 'explorerUrl', label: '浏览器链接', group: '订单' },
  { key: 'reason', label: '失败原因', group: '订单' },
  { key: 'currency', label: '币种', group: '订单' }
];

export const VAR_ENERGY = [
  { key: 'energyPriceTrx', label: '能量单价 TRX', group: '能量' },
  { key: 'energyPriceEnergy', label: '对应能量数', group: '能量' },
  { key: 'energyMinAmount', label: '能量最低 TRX', group: '能量' },
  { key: 'energyValidityHours', label: '能量有效小时', group: '能量' },
  { key: 'energyNotice', label: '能量公告', group: '能量' },
  { key: 'energyAddress', label: '能量收款地址', group: '能量' },
  { key: 'trxBalance', label: 'TRX 余额', group: '能量' },
  { key: 'trxDepositMin', label: '最低充值 TRX', group: '能量' }
];

export const VAR_SWAP = [
  { key: 'swapRate', label: '闪兑汇率', group: '闪兑' },
  { key: 'swapLastUpdate', label: '汇率更新时间', group: '闪兑' },
  { key: 'swapAddress', label: '闪兑收款地址', group: '闪兑' },
  { key: 'swapNotice', label: '闪兑公告', group: '闪兑' }
];

export const VAR_ACCOUNT = [
  { key: 'totalOrders', label: '总订单数', group: '账户' },
  { key: 'completedOrders', label: '已完成订单', group: '账户' },
  { key: 'pendingOrders', label: '处理中订单', group: '账户' }
];

export const ALL_VARS = [...VAR_ALWAYS, ...VAR_PAYMENT, ...VAR_ORDER, ...VAR_ENERGY, ...VAR_SWAP, ...VAR_ACCOUNT];
export const DEFAULT_VARS = VAR_ALWAYS;

// 这个场景发消息时，handler 会额外传哪些值（通用变量由 Bot 自己补）
export const SCENE_VARS = {
  welcome_new_user: ['siteName', 'username', 'telegramId', 'websiteUrl'],
  welcome_returning_user: ['firstName', 'email', 'telegramId'],
  help_center: ['siteName', 'customerService', 'websiteUrl'],
  help_faq: ['customerService', 'websiteUrl'],
  help_contact: ['customerService', 'websiteUrl'],
  help_tutorial: ['websiteUrl'],
  payment_usdt_input: ['minAmount', 'maxAmount'],
  payment_trx_input: ['minAmount', 'maxAmount'],
  payment_usdt_order_detail: ['amount', 'rate', 'cnyAmount', 'serviceFee', 'feeLabel', 'totalCNY'],
  payment_trx_order_detail: ['amount', 'rate', 'cnyAmount', 'serviceFee', 'feeLabel', 'totalCNY'],
  payment_order_confirm: ['amount', 'type', 'address', 'totalCNY'],
  payment_select_method: ['amount', 'type', 'address', 'cnyAmount', 'serviceFee', 'totalCNY'],
  payment_qrcode: ['paymentName', 'orderId', 'amount', 'type', 'address', 'totalCNY'],
  payment_success: ['_id', 'orderId', 'totalCNY', 'payType'],
  transfer_complete: ['_id', 'orderId', 'amount', 'payType', 'address', 'txHash'],
  transfer_failed: ['_id', 'orderId', 'platformOrderId', 'amount', 'payType', 'reason'],
  orders_list: ['orderCount', 'orderList'],
  order_detail: [
    'orderId', 'payType', 'amount', 'address', 'totalCNY', 'serviceFee',
    'paymentStatus', 'transferStatus', 'status', 'createdAt', 'paymentTime', 'transferTime', 'txHash'
  ],
  order_completed: ['orderId', 'type', 'amount', 'currency', 'address', 'txHash', 'explorerUrl'],
  order_failed: ['orderId', 'reason'],
  energy_rental: ['energyPriceTrx', 'energyPriceEnergy', 'energyMinAmount', 'trxBalance', 'trxDepositMin', 'energyNotice'],
  swap_service: ['swapRate', 'swapLastUpdate', 'swapAddress', 'swapNotice'],
  account_info: ['username', 'email', 'telegramId', 'createdAt', 'totalOrders', 'completedOrders', 'pendingOrders']
};

export const varsForScene = (key) => {
  const sceneKeys = new Set(SCENE_VARS[key] || []);
  const alwaysKeys = new Set(VAR_ALWAYS.map((item) => item.key));
  const live = [];
  const rest = [];
  ALL_VARS.forEach((item) => {
    if (alwaysKeys.has(item.key) || sceneKeys.has(item.key)) live.push({ ...item, live: true });
    else rest.push({ ...item, live: false });
  });
  return [...live, ...rest];
};

export const sceneMeta = (key) => CORE_SCENES.find((s) => s.key === key);

export const welcomeKeyOf = (id) =>
  WELCOME_VERSIONS.find((v) => v.id === id)?.key || 'welcome_new_user';

export const contentText = (item) => item?.content?.text || item?.content?.caption || '';

export const makeContentPayload = (key, name, category, text, buttons = []) => ({
  key,
  name,
  category: category || 'custom',
  content: { type: 'text', text: text || '', parseMode: 'HTML' },
  buttons: buttons || [],
  enabled: true
});

export const ENERGY_FEED_SAMPLE = [
  '💍交易类别：能量租赁',
  '⏱️交易时间：2026-09-06 09:28:51',
  '交易能量：65000',
  '✅接收地址：TLGw2Pac ***** iiaw6Ucxie',
  '🅾️发送地址：TLSWMuA3 ***** PEzfxXHsjx'
].join('\n');

export const buttonsByRow = (buttons = []) => {
  const rows = {};
  buttons.forEach((btn, index) => {
    const row = Number.isFinite(btn.row) ? btn.row : 0;
    if (!rows[row]) rows[row] = [];
    rows[row].push({ ...btn, _index: index });
  });
  return Object.keys(rows)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map((row) => ({
      row,
      items: rows[row].sort((a, b) => (a.col || 0) - (b.col || 0))
    }));
};

export const wrapHtml = (text, start, end, open, close) => {
  const from = Number.isFinite(start) ? start : text.length;
  const to = Number.isFinite(end) ? end : text.length;
  const selected = text.slice(from, to) || '文字';
  return text.slice(0, from) + open + selected + close + text.slice(to);
};

export const sanitizeTgHtml = (html) =>
  String(html || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?(b|strong|i|em|u|s|code|pre))&gt;/gi, '<$1>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br/>')
    .replace(/&lt;a href=&quot;([^&]+)&quot;&gt;/gi, '<a href="$1">')
    .replace(/&lt;\/a&gt;/gi, '</a>')
    .replace(/\n/g, '<br/>');

// 手机预览里把 {{变量}} 换成看起来像真聊天的值，不写进数据库
export const PREVIEW_SAMPLE = {
  siteName: '可可代付',
  username: 'xiaoke',
  firstName: '小可',
  telegramId: '10001',
  email: 'demo@opay.local',
  websiteUrl: 'https://opay.example',
  customerService: '@kefu',
  minAmount: '10',
  maxAmount: '50000',
  amount: '100',
  type: 'USDT',
  payType: 'USDT',
  rate: '7.20',
  cnyAmount: '720.00',
  serviceFee: '7.20',
  feeLabel: '1%',
  totalCNY: '727.20',
  address: 'TXdemo...abcd',
  paymentName: '支付宝',
  orderId: 'ORD20260314001',
  platformOrderId: 'P20260314001',
  _id: 'demoOrder',
  orderCount: '3',
  orderList: '1. ORD…001  100 USDT  处理中\n2. ORD…002  50 TRX  已完成',
  paymentStatus: '已支付',
  transferStatus: '处理中',
  status: '处理中',
  createdAt: '2026-03-14',
  paymentTime: '支付时间：12:05\n',
  transferTime: '',
  txHash: 'a1b2c3d4e5f6…',
  explorerUrl: 'https://tronscan.org/#/transaction/demo',
  reason: '余额不足',
  currency: 'USDT',
  energyPriceTrx: '1',
  energyPriceEnergy: '65,000',
  energyMinAmount: '10',
  energyValidityHours: '24',
  energyNotice: '到账后自动租能量',
  energyAddress: 'TEnergy...demo',
  trxBalance: '36.5',
  trxDepositMin: '10',
  swapRate: '6.72',
  swapLastUpdate: '03-14 12:00',
  swapAddress: 'TSwap...demo',
  swapNotice: '以到账时汇率为准',
  totalOrders: '12',
  completedOrders: '9',
  pendingOrders: '3'
};

export const fillPreviewVars = (text, extra = {}) => {
  const vars = { ...PREVIEW_SAMPLE, ...extra };
  return String(text || '').replace(/\{\{(\w+)\}\}/g, (full, key) =>
    vars[key] == null ? full : String(vars[key])
  );
};
