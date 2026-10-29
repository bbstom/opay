import { DEFAULT_TEMPLATES } from '../../../components/TelegramContentEditor';

const GROUP_BY_CATEGORY = {
  welcome: '开场',
  payment: '代付',
  order: '订单',
  help: '帮助',
  custom: '服务'
};

const previewOf = (text) =>
  String(text || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 56);

export const COPY_GROUPS = ['全部', '开场', '代付', '订单', '能量', '闪兑', '帮助', '账户', '积木'];

const style = (key, name, group, text, buttons = []) => ({
  key,
  name,
  group,
  text,
  buttons,
  style: true
});

// 风格模板：点一下套进当前正在编辑的那条消息，不跳场景
export const COPY_STYLES = [
  style(
    'style_welcome_warm',
    '热情欢迎',
    '开场',
    `🎊 <b>欢迎来到 {{siteName}}</b>\n\n` +
      `你好，{{firstName}}！账户已经准备好。\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>用户名：</code>{{username}}\n` +
      `<code>TG ID：</code>{{telegramId}}\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `👇 选一项开始`
  ),
  style(
    'style_welcome_short',
    '一句欢迎',
    '开场',
    `👋 你好，{{firstName}}\n\n需要代付、能量还是闪兑？直接点下面。`
  ),
  style(
    'style_welcome_web',
    '网站三步引导',
    '开场',
    `🌐 <b>网站同步使用</b>\n\n` +
      `<code>1️⃣</code> 打开 {{websiteUrl}}\n` +
      `<code>2️⃣</code> 点「使用 Telegram 登录」\n` +
      `<code>3️⃣</code> 授权后网页和机器人同一账户\n\n` +
      `客服：{{customerService}}`
  ),
  style(
    'style_welcome_menu',
    '服务清单',
    '开场',
    `📋 <b>{{siteName}} 能做什么</b>\n\n` +
      `💰 USDT / TRX 代付\n` +
      `⚡ 能量租赁\n` +
      `🔄 USDT 闪兑 TRX\n` +
      `📋 查订单 / 💬 工单\n\n` +
      `👇 请选择`
  ),
  style(
    'style_welcome_back',
    '老用户卡片',
    '开场',
    `🎉 <b>欢迎回来</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>称呼：</code>{{firstName}}\n` +
      `<code>邮箱：</code>{{email}}\n` +
      `<code>TG ID：</code>{{telegramId}}\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `继续上次的服务，或重新选一项 👇`
  ),
  style(
    'style_pay_input',
    '输入数量',
    '代付',
    `💰 <b>请输入数量</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>最小：</code>{{minAmount}}\n` +
      `<code>最大：</code>{{maxAmount}}\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `💡 直接发数字，例如 <code>100</code>`
  ),
  style(
    'style_pay_limit',
    '强调限额',
    '代付',
    `⚠️ <b>请先看限额再输入</b>\n\n` +
      `少于 {{minAmount}} 无法下单\n` +
      `大于 {{maxAmount}} 请拆单\n\n` +
      `发一个数字过来即可`
  ),
  style(
    'style_pay_bill',
    '确认账单',
    '代付',
    `🧾 <b>请确认账单</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>数量：</code><b>{{amount}}</b>\n` +
      `<code>汇率：</code>{{rate}}\n` +
      `<code>金额：</code>{{cnyAmount}} CNY\n` +
      `<code>服务费：</code>{{serviceFee}} {{feeLabel}}\n` +
      `<code>应付：</code><b>{{totalCNY}} CNY</b>\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `确认无误再继续`
  ),
  style(
    'style_pay_address',
    '确认地址',
    '代付',
    `📍 <b>确认收款地址</b>\n\n` +
      `<code>{{address}}</code>\n\n` +
      `数量 <b>{{amount}} {{type}}</b>\n` +
      `应付 <b>{{totalCNY}} CNY</b>\n\n` +
      `地址错了会打到别人钱包，请再看一眼`
  ),
  style(
    'style_pay_qr',
    '收款码说明',
    '代付',
    `📷 <b>{{paymentName}}</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>订单：</code>{{orderId}}\n` +
      `<code>数量：</code>{{amount}} {{type}}\n` +
      `<code>应付：</code><b>{{totalCNY}} CNY</b>\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `扫码支付，完成后面会自动通知`
  ),
  style(
    'style_pay_ok',
    '支付成功等待',
    '代付',
    `🎉 <b>已收到付款</b>\n\n` +
      `<code>订单：</code><code>{{orderId}}</code>\n` +
      `<code>金额：</code><b>{{totalCNY}} CNY</b>\n\n` +
      `⏳ 正在处理 {{payType}} 代付，大约 2-10 分钟\n` +
      `💬 完成后会推给你，不用反复刷新`
  ),
  style(
    'style_pay_done',
    '打款完成',
    '代付',
    `✅ <b>代付已到账</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>订单：</code><code>{{orderId}}</code>\n` +
      `<code>数量：</code><b>{{amount}} {{payType}}</b>\n` +
      `<code>地址：</code><code>{{address}}</code>\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `🔗 交易哈希\n<code>{{txHash}}</code>`
  ),
  style(
    'style_pay_fail',
    '打款失败',
    '代付',
    `❌ <b>代付失败</b>\n\n` +
      `<code>订单：</code><code>{{orderId}}</code>\n` +
      `<code>数量：</code>{{amount}} {{payType}}\n\n` +
      `<b>原因</b>\n<i>{{reason}}</i>\n\n` +
      `可查看订单或联系客服 {{customerService}}`
  ),
  style(
    'style_orders_empty',
    '还没有订单',
    '订单',
    `📋 还没有订单\n\n从代付、能量或闪兑开始第一笔。`
  ),
  style(
    'style_orders_list',
    '订单列表',
    '订单',
    `📋 <b>我的订单</b> 共 {{orderCount}} 笔\n\n{{orderList}}\n\n点某一笔看详情`
  ),
  style(
    'style_order_card',
    '订单详情卡',
    '订单',
    `📄 <b>订单详情</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>订单号：</code>{{orderId}}\n` +
      `<code>类型：</code>{{payType}}\n` +
      `<code>数量：</code>{{amount}}\n` +
      `<code>地址：</code><code>{{address}}</code>\n` +
      `<code>应付：</code>{{totalCNY}} CNY\n` +
      `<code>支付：</code>{{paymentStatus}}\n` +
      `<code>代付：</code>{{transferStatus}}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `{{paymentTime}}{{transferTime}}{{txHash}}`
  ),
  style(
    'style_energy_card',
    '能量价格卡',
    '能量',
    `⚡ <b>能量租赁</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>价格：</code>{{energyPriceTrx}} TRX = {{energyPriceEnergy}} 能量\n` +
      `<code>下限：</code>{{energyMinAmount}} TRX\n` +
      `<code>余额：</code>{{trxBalance}} TRX\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `链上转账：转到租赁地址后自动租\n` +
      `余额支付：先充值，再用余额租`
  ),
  style(
    'style_energy_chain',
    '链上租赁说明',
    '能量',
    `⚡ <b>链上转账租赁</b>\n\n` +
      `转到能量地址后系统自动租。\n` +
      `有效 {{energyValidityHours}} 小时。\n\n` +
      `{{energyNotice}}`
  ),
  style(
    'style_energy_balance',
    '余额租赁说明',
    '能量',
    `💎 <b>余额租赁</b>\n\n` +
      `当前余额 <b>{{trxBalance}} TRX</b>\n` +
      `最少 {{energyMinAmount}} TRX\n\n` +
      `接下来发收款地址，再发支付数量`
  ),
  style(
    'style_swap_card',
    '闪兑汇率卡',
    '闪兑',
    `🔄 <b>USDT 闪兑 TRX</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>汇率：</code><b>1 USDT = {{swapRate}} TRX</b>\n` +
      `<code>更新：</code>{{swapLastUpdate}}\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `📍 收款地址\n<code>{{swapAddress}}</code>\n\n` +
      `{{swapNotice}}`
  ),
  style(
    'style_swap_steps',
    '闪兑四步',
    '闪兑',
    `🔄 <b>怎么闪兑</b>\n\n` +
      `1️⃣ 转入 USDT 到收款地址\n` +
      `2️⃣ 系统检测到账\n` +
      `3️⃣ 按到账时汇率换成 TRX\n` +
      `4️⃣ TRX 自动转回你的地址\n\n` +
      `当前 1 USDT = <b>{{swapRate}}</b> TRX`
  ),
  style(
    'style_help_home',
    '帮助首页',
    '帮助',
    `❓ <b>{{siteName}} 帮助</b>\n\n` +
      `代付：输入数量和地址，微信/支付宝付款\n` +
      `能量：转 TRX 或用余额租\n` +
      `闪兑：转 USDT，自动换 TRX\n\n` +
      `客服 {{customerService}}\n` +
      `网站 {{websiteUrl}}`
  ),
  style(
    'style_help_faq',
    '常见问答',
    '帮助',
    `❓ <b>常见问题</b>\n\n` +
      `<b>多久到账？</b>\n通常 2-10 分钟。\n\n` +
      `<b>怎么查单？</b>\n点「我的订单」。\n\n` +
      `<b>出问题？</b>\n创建工单或联系 {{customerService}}`
  ),
  style(
    'style_help_cs',
    '联系客服',
    '帮助',
    `💬 <b>联系客服</b>\n\n` +
      `时间 9:00 - 22:00\n` +
      `客服 {{customerService}}\n` +
      `网站 {{websiteUrl}}\n\n` +
      `有订单号请一并发给客服`
  ),
  style(
    'style_account_card',
    '个人中心卡',
    '账户',
    `👤 <b>个人中心</b>\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>用户名：</code>{{username}}\n` +
      `<code>邮箱：</code>{{email}}\n` +
      `<code>TG ID：</code>{{telegramId}}\n` +
      `<code>注册：</code>{{createdAt}}\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `<code>总订单：</code>{{totalOrders}}\n` +
      `<code>已完成：</code>{{completedOrders}}\n` +
      `<code>处理中：</code>{{pendingOrders}}`
  ),
  style(
    'style_ticket_open',
    '工单开场',
    '账户',
    `💬 <b>我的工单</b>\n\n查看进度，或点下方创建新工单。`
  )
];

export const COPY_SNIPPETS = [
  { key: 'snip_divider', name: '分隔线', group: '积木', text: '━━━━━━━━━━━━━━━', buttons: [] },
  { key: 'snip_choose', name: '请选择服务', group: '积木', text: '👇 请选择您需要的服务', buttons: [] },
  { key: 'snip_wait', name: '等待到账', group: '积木', text: '⏰ 支付后请等待 <b>2-10 分钟</b>\n💬 完成后会自动通知您', buttons: [] },
  { key: 'snip_input_num', name: '请输入数字', group: '积木', text: '💡 直接输入数字即可\n例如：<code>100</code>', buttons: [] },
  { key: 'snip_address', name: '请输入地址', group: '积木', text: '📍 <b>请输入收款地址</b>\n<i>(TRON 地址，以 T 开头)</i>', buttons: [] },
  { key: 'snip_contact', name: '联系客服', group: '积木', text: '💬 如有疑问，请联系客服 {{customerService}}', buttons: [] },
  { key: 'snip_site', name: '网站入口', group: '积木', text: '🌐 <b>网站地址</b>\n{{websiteUrl}}', buttons: [] }
];

export const COPY_EXTRAS = [
  {
    key: 'energy_rental',
    name: '能量租赁开场',
    category: 'custom',
    group: '能量',
    content: {
      text:
        `⚡ <b>能量租赁</b>\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `<code>价格：</code>{{energyPriceTrx}} TRX = {{energyPriceEnergy}} 能量\n` +
        `<code>下限：</code>{{energyMinAmount}} TRX\n` +
        `<code>余额：</code>{{trxBalance}} TRX\n` +
        `━━━━━━━━━━━━━━━\n\n` +
        `链上转账或余额支付都可以。`
    },
    buttons: []
  },
  {
    key: 'swap_service',
    name: '闪兑开场',
    category: 'custom',
    group: '闪兑',
    content: {
      text:
        `🔄 <b>USDT 闪兑 TRX</b>\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `<code>汇率：</code><b>1 USDT = {{swapRate}} TRX</b>\n` +
        `<code>更新：</code>{{swapLastUpdate}}\n` +
        `━━━━━━━━━━━━━━━\n\n` +
        `📍 收款地址\n<code>{{swapAddress}}</code>\n\n` +
        `{{swapNotice}}`
    },
    buttons: []
  },
  {
    key: 'tickets_list',
    name: '工单开场',
    category: 'custom',
    group: '账户',
    content: {
      text: `💬 <b>我的工单</b>\n\n查看进度，或点下方创建新工单。`
    },
    buttons: [{ text: '📝 创建工单', type: 'callback', data: 'create_ticket', row: 0, col: 0 }]
  },
  {
    key: 'account_info',
    name: '个人中心开场',
    category: 'custom',
    group: '账户',
    content: {
      text:
        `👤 <b>个人中心</b>\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `<code>用户名：</code>{{username}}\n` +
        `<code>邮  箱：</code>{{email}}\n` +
        `<code>TG ID：</code>{{telegramId}}\n` +
        `<code>注册：</code>{{createdAt}}\n` +
        `━━━━━━━━━━━━━━━\n\n` +
        `<code>总订单：</code>{{totalOrders}}\n` +
        `<code>已完成：</code>{{completedOrders}}\n` +
        `<code>处理中：</code>{{pendingOrders}}`
    },
    buttons: []
  }
];

const toItem = (key, tpl, group) => ({
  key,
  name: tpl.name,
  group: tpl.group || group,
  category: tpl.category,
  text: tpl.content?.text || tpl.text || '',
  buttons: tpl.buttons || [],
  preview: previewOf(tpl.content?.text || tpl.text)
});

export const copyTemplates = () => {
  const styles = COPY_STYLES.map((item) => ({
    ...item,
    preview: previewOf(item.text)
  }));
  const fromEditor = Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) =>
    toItem(key, tpl, GROUP_BY_CATEGORY[tpl.category] || '开场')
  );
  const extras = COPY_EXTRAS.filter((item) => !DEFAULT_TEMPLATES[item.key]).map((item) =>
    toItem(item.key, item, item.group || GROUP_BY_CATEGORY[item.category] || '服务')
  );
  const snips = COPY_SNIPPETS.map((item) => ({ ...item, preview: previewOf(item.text), snippet: true }));
  return [...styles, ...fromEditor, ...extras, ...snips];
};
