const { Markup } = require('telegraf');
const WithdrawRequest = require('../../models/WithdrawRequest');
const rewardService = require('../../services/rewardService');
const contentService = require('../services/contentService');

const WITHDRAW_LABEL = {
  pending: '待审核',
  paid: '已打款',
  rejected: '已驳回'
};

const requireUser = (ctx) => ctx.session?.user || null;

const answerIfCallback = async (ctx, text) => {
  if (!ctx.callbackQuery) return;
  await ctx.answerCbQuery(text || undefined).catch(() => {});
};

const clearWithdraw = (ctx) => {
  if (!ctx.session) return;
  if (ctx.session.state === 'waiting_withdraw_amount' || ctx.session.state === 'waiting_withdraw_address') {
    delete ctx.session.state;
  }
  delete ctx.session.withdrawData;
};

const webInviteUrlOf = (code) => {
  const base = String(process.env.APP_URL || '').replace(/\/$/, '');
  return code && base ? `${base}/login?invite=${code}` : '';
};

const summaryVars = (summary) => ({
  trxBalance: summary.trxBalance,
  usdtReward: summary.usdtReward,
  checkinTrx: summary.checkinTrx,
  checkinStatus: summary.checkedInToday ? '今日已签到' : '今日未签到',
  inviteCode: summary.inviteCode || '',
  inviteeCount: summary.inviteeCount,
  inviteSignupTrx: summary.inviteSignupTrx,
  telegramInviteUrl: summary.telegramInviteUrl || '',
  webInviteUrl: webInviteUrlOf(summary.inviteCode),
  withdrawMinUsdt: summary.withdrawMinUsdt,
  withdrawFeeUsdt: summary.withdrawFeeUsdt,
  consumeRewardUsdtPercent: summary.consumeRewardUsdtPercent
});

const navKeyboard = (extraRows = []) => Markup.inlineKeyboard([
  ...extraRows,
  [
    Markup.button.callback('📅 签到', 'reward_checkin'),
    Markup.button.callback('🎁 邀请', 'reward_invite'),
    Markup.button.callback('💸 提现', 'reward_withdraw')
  ],
  [Markup.button.callback('« 返回主菜单', 'back_to_main')]
]);

const cancelKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('« 取消', 'reward_withdraw')]
]);

const replyHtml = async (ctx, text, keyboard) => {
  const options = { parse_mode: 'HTML', ...(keyboard || {}) };
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, options);
      return;
    } catch (error) {
      const msg = error.message || '';
      if (!msg.includes('message to edit') && !msg.includes('message is not modified')) {
        throw error;
      }
    }
  }
  await ctx.reply(text, options);
};

const sendScene = async (ctx, key, vars, keyboard, fallback) => {
  const sent = await contentService.sendContent(ctx, key, vars, keyboard);
  if (sent) return;
  await replyHtml(ctx, fallback, keyboard);
};

const loadSummary = async (user) => rewardService.getSummary(user._id);

const recentWithdrawText = async (userId) => {
  const rows = await WithdrawRequest.find({ userId }).sort({ createdAt: -1 }).limit(3).lean();
  if (!rows.length) return '暂无提现';
  return rows
    .map((row) => `${row.amount} USDT · ${WITHDRAW_LABEL[row.status] || row.status}`)
    .join('\n');
};

async function showCheckin(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');
  clearWithdraw(ctx);
  await answerIfCallback(ctx);

  const summary = await loadSummary(user);
  const vars = summaryVars(summary);
  const extra = [];
  if (summary.rewardEnabled && summary.checkinEnabled && !summary.checkedInToday) {
    extra.push([Markup.button.callback(`📅 签到 +${summary.checkinTrx} TRX`, 'reward_do_checkin')]);
  }
  const hint = !summary.rewardEnabled || !summary.checkinEnabled
    ? '签到暂未开启。'
    : (summary.checkedInToday ? '明天再来签到。' : '点下方按钮领取今日奖励。');
  const fallback =
    `📅 <b>每日签到</b>\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `<code>TRX 余额：</code><b>${summary.trxBalance}</b>\n` +
    `<code>今日状态：</code>${vars.checkinStatus}\n` +
    `<code>签到奖励：</code>+${summary.checkinTrx} TRX\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    hint;

  await sendScene(ctx, 'reward_checkin', vars, navKeyboard(extra), fallback);
}

async function doCheckin(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');
  try {
    const result = await rewardService.checkin(user._id);
    if (ctx.session.user) ctx.session.user.trxBalance = result.trxBalance;
    await answerIfCallback(ctx, `签到成功 +${result.trx} TRX`);
    const summary = await loadSummary(user);
    const vars = { ...summaryVars(summary), checkinTrxGot: result.trx };
    const fallback =
      `✅ <b>签到成功</b>\n\n` +
      `到账 <b>+${result.trx} TRX</b>\n` +
      `<code>当前余额：</code>${result.trxBalance} TRX\n\n` +
      `可用于能量租赁。`;
    await sendScene(ctx, 'reward_checkin_ok', vars, navKeyboard(), fallback);
  } catch (err) {
    await answerIfCallback(ctx, err.message || '签到失败');
    await showCheckin(ctx);
  }
}

async function showInvite(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');
  clearWithdraw(ctx);
  await answerIfCallback(ctx);

  const summary = await loadSummary(user);
  const vars = summaryVars(summary);
  const extra = [];
  if (vars.telegramInviteUrl) {
    extra.push([Markup.button.url('📤 分享邀请链接', vars.telegramInviteUrl)]);
  }
  const fallback =
    `🎁 <b>邀请好友</b>\n\n` +
    `好友注册，你得 <b>+${summary.inviteSignupTrx} TRX</b>\n` +
    `下级消费返 <b>${summary.consumeRewardUsdtPercent}%</b> USDT，可提现\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `<code>邀请码：</code><code>${vars.inviteCode}</code>\n` +
    `<code>已邀请：</code>${summary.inviteeCount} 人\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    (vars.telegramInviteUrl ? `机器人链接：\n<code>${vars.telegramInviteUrl}</code>\n\n` : '') +
    (vars.webInviteUrl ? `网站链接：\n<code>${vars.webInviteUrl}</code>\n\n` : '') +
    `长按上方链接即可复制。`;

  await sendScene(ctx, 'reward_invite', vars, navKeyboard(extra), fallback);
}

async function showWithdraw(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');
  clearWithdraw(ctx);
  await answerIfCallback(ctx);

  const summary = await loadSummary(user);
  const vars = summaryVars(summary);
  const withdrawList = await recentWithdrawText(user._id);
  vars.withdrawList = withdrawList;
  const extra = [];
  if (summary.rewardEnabled && summary.usdtReward + 1e-9 >= summary.withdrawMinUsdt) {
    extra.push([Markup.button.callback('💸 申请提现', 'reward_withdraw_start')]);
  }
  const hint = !summary.rewardEnabled
    ? '奖励暂未开启。'
    : (summary.usdtReward + 1e-9 < summary.withdrawMinUsdt
      ? `余额未到最低提现 ${summary.withdrawMinUsdt} USDT。`
      : '点下方申请提现，按提示输入金额和地址。');
  const fallback =
    `💸 <b>USDT 提现</b>\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `<code>可提现：</code><b>${summary.usdtReward}</b> USDT\n` +
    `<code>最低提现：</code>${summary.withdrawMinUsdt} USDT\n` +
    `<code>手续费：</code>${summary.withdrawFeeUsdt} USDT\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `${hint}\n\n` +
    `<b>最近提现</b>\n${withdrawList}`;

  await sendScene(ctx, 'reward_withdraw', vars, navKeyboard(extra), fallback);
}

async function startWithdraw(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');
  await answerIfCallback(ctx);

  const summary = await loadSummary(user);
  if (!summary.rewardEnabled) {
    return showWithdraw(ctx);
  }
  if (summary.usdtReward + 1e-9 < summary.withdrawMinUsdt) {
    return showWithdraw(ctx);
  }

  ctx.session.state = 'waiting_withdraw_amount';
  ctx.session.withdrawData = {};
  const vars = summaryVars(summary);
  const fallback =
    `💸 <b>申请提现</b>\n\n` +
    `<code>可提现：</code>${summary.usdtReward} USDT\n` +
    `<code>最低：</code>${summary.withdrawMinUsdt} USDT\n` +
    `<code>手续费：</code>${summary.withdrawFeeUsdt} USDT\n\n` +
    `请输入提现金额，例如：<code>10</code>`;

  await sendScene(ctx, 'reward_withdraw_amount', vars, cancelKeyboard, fallback);
}

async function handleWithdrawAmount(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');

  const raw = String(ctx.message?.text || '').trim();
  const qty = rewardService.round6(raw);
  const summary = await loadSummary(user);

  if (!(qty > 0)) {
    return ctx.reply('请输入有效数字，例如：<code>10</code>', { parse_mode: 'HTML' });
  }
  if (qty + 1e-9 < summary.withdrawMinUsdt) {
    return ctx.reply(`最低提现 ${summary.withdrawMinUsdt} USDT，请重新输入。`);
  }
  if (qty - summary.withdrawFeeUsdt <= 0) {
    return ctx.reply('提现金额需大于手续费，请重新输入。');
  }
  if (qty - 1e-9 > summary.usdtReward) {
    return ctx.reply(`余额不足，当前可提现 ${summary.usdtReward} USDT。`);
  }

  ctx.session.withdrawData = { amount: qty };
  ctx.session.state = 'waiting_withdraw_address';
  const vars = {
    ...summaryVars(summary),
    withdrawAmount: qty,
    withdrawFee: summary.withdrawFeeUsdt,
    withdrawNet: rewardService.round6(qty - summary.withdrawFeeUsdt)
  };
  const fallback =
    `📍 <b>请输入收款地址</b>\n\n` +
    `<code>金额：</code>${qty} USDT\n` +
    `<i>USDT-TRC20，以 T 开头</i>`;

  await sendScene(ctx, 'reward_withdraw_address', vars, cancelKeyboard, fallback);
}

async function handleWithdrawAddress(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');

  const address = String(ctx.message?.text || '').trim();
  if (!rewardService.isTronAddress(address)) {
    return ctx.reply('地址无效，请输入以 T 开头的 TRON 地址。');
  }

  const amount = Number(ctx.session?.withdrawData?.amount);
  if (!(amount > 0)) {
    ctx.session.state = 'waiting_withdraw_amount';
    return ctx.reply('请先输入提现金额。');
  }

  const summary = await loadSummary(user);
  const fee = summary.withdrawFeeUsdt;
  const net = rewardService.round6(amount - fee);
  ctx.session.withdrawData = { amount, address };
  ctx.session.state = null;

  const vars = {
    ...summaryVars(summary),
    withdrawAmount: amount,
    withdrawFee: fee,
    withdrawNet: net,
    withdrawAddress: address
  };
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ 确认提现', 'reward_withdraw_confirm'),
      Markup.button.callback('❌ 取消', 'reward_withdraw')
    ]
  ]);
  const fallback =
    `✅ <b>确认提现</b>\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `<code>金额：</code>${amount} USDT\n` +
    `<code>手续费：</code>${fee} USDT\n` +
    `<code>到账：</code><b>${net} USDT</b>\n` +
    `<code>地址：</code><code>${address}</code>\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `提交后等待审核打款。`;

  await sendScene(ctx, 'reward_withdraw_confirm', vars, keyboard, fallback);
}

async function confirmWithdraw(ctx) {
  const user = requireUser(ctx);
  if (!user) return ctx.reply('请先使用 /start 命令');

  const amount = Number(ctx.session?.withdrawData?.amount);
  const address = ctx.session?.withdrawData?.address;
  if (!(amount > 0) || !address) {
    await answerIfCallback(ctx, '请重新申请提现');
    return showWithdraw(ctx);
  }

  try {
    const withdraw = await rewardService.requestWithdraw({
      userId: user._id,
      amount,
      address
    });
    clearWithdraw(ctx);
    const summary = await loadSummary(user);
    if (ctx.session.user) ctx.session.user.usdtReward = summary.usdtReward;
    await answerIfCallback(ctx, '提现已提交');
    const vars = {
      ...summaryVars(summary),
      withdrawAmount: withdraw.amount,
      withdrawFee: withdraw.fee,
      withdrawNet: withdraw.netAmount,
      withdrawAddress: withdraw.address
    };
    const fallback =
      `✅ <b>提现已提交</b>\n\n` +
      `<code>金额：</code>${withdraw.amount} USDT\n` +
      `<code>到账：</code>${withdraw.netAmount} USDT\n` +
      `<code>地址：</code><code>${withdraw.address}</code>\n\n` +
      `请等待审核打款。`;
    await sendScene(ctx, 'reward_withdraw_ok', vars, navKeyboard(), fallback);
  } catch (err) {
    await answerIfCallback(ctx, err.message || '提现失败');
    await ctx.reply(`❌ ${err.message || '提现失败'}`);
  }
}

async function handleCallback(ctx) {
  const data = ctx.callbackQuery?.data || '';
  switch (data) {
    case 'reward_checkin':
      return showCheckin(ctx);
    case 'reward_do_checkin':
      return doCheckin(ctx);
    case 'reward_invite':
      return showInvite(ctx);
    case 'reward_withdraw':
      return showWithdraw(ctx);
    case 'reward_withdraw_start':
      return startWithdraw(ctx);
    case 'reward_withdraw_confirm':
      return confirmWithdraw(ctx);
    default:
      await answerIfCallback(ctx, '未知操作');
  }
}

module.exports = {
  showCheckin,
  showInvite,
  showWithdraw,
  handleWithdrawAmount,
  handleWithdrawAddress,
  handleCallback,
  clearWithdraw
};
