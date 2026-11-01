const User = require('../../models/User');
const Settings = require('../../models/Settings');
const { Markup } = require('telegraf');
const { getBackKeyboard, getMainReplyKeyboard } = require('../keyboards/main');
const contentService = require('../services/contentService');
const rewardService = require('../../services/rewardService');

async function attachReplyMenu(ctx, text) {
  const keyboard = await getMainReplyKeyboard();
  await ctx.reply(text || '👇 请从底部选择功能', { parse_mode: 'HTML', ...keyboard });
}

async function sendFunctionMenu(ctx) {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
  }
  await attachReplyMenu(ctx);
}

// /start 命令处理
async function start(ctx) {
  const telegramId = ctx.from.id.toString();
  const username = ctx.from.username || `tg_${telegramId}`;
  const firstName = ctx.from.first_name || 'User';
  const lastName = ctx.from.last_name || '';
  const photoUrl = ctx.from.photo_url || '';

  // 检查是否是扫码登录
  const startPayload = ctx.message?.text?.split(' ')[1];
  if (startPayload && startPayload.startsWith('login_')) {
    return handleQRLogin(ctx, startPayload, telegramId, username, firstName, lastName, photoUrl);
  }

  try {
    // 确保 session 已初始化
    if (!ctx.session) {
      ctx.session = {};
    }

    // 获取系统设置
    const settings = await Settings.findOne();
    const siteName = settings?.siteName || '可可代付';
    const websiteUrl = process.env.APP_URL || 'https://kk.vpno.eu.org';

    // 检查用户是否已存在
    let user = await User.findOne({ telegramId });
    const inviteCode = rewardService.parseInvitePayload(startPayload);

    if (user) {
      // 已有账户，欢迎回来
      if (inviteCode) {
        await rewardService.bindInviter(user, inviteCode);
        user = await User.findById(user._id) || user;
      }
      ctx.session.user = user;
      
      // 检查是否有从群组跳转的操作参数（邀请码不当操作处理）
      if (startPayload && startPayload !== 'start' && !inviteCode) {
        // 先发送欢迎消息
        await ctx.reply(
          `👋 欢迎回来！正在为您执行操作...`,
          { parse_mode: 'HTML', ...(await getMainReplyKeyboard()) }
        );
        return await handleStartPayload(ctx, startPayload);
      }
      
      const replyMenu = await getMainReplyKeyboard();
      const sent = await contentService.sendContent(ctx, 'welcome_returning_user', {
        firstName,
        email: user.email,
        telegramId
      }, replyMenu);

      if (!sent) {
        await ctx.reply(
          `🎉 <b>欢迎回来！</b>\n\n` +
          `👤 <b>账户信息</b>\n` +
          `━━━━━━━━━━━━━━━\n` +
          `<code>用户名：</code>${firstName}\n` +
          `<code>邮  箱：</code>${user.email}\n` +
          `<code>TG ID：</code>${telegramId}\n` +
          `━━━━━━━━━━━━━━━\n\n` +
          `👇 请从底部选择功能`,
          { parse_mode: 'HTML', ...replyMenu }
        );
      }
    } else {
      // 新用户，自动创建账户
      user = await User.create({
        username: username,
        email: `${telegramId}@telegram.user`,
        telegramId: telegramId,
        telegramUsername: username,
        telegramFirstName: firstName,
        telegramLastName: lastName,
        telegramBound: true,
        source: 'telegram',
        role: 'user'
      });
      await rewardService.afterUserCreated(user, inviteCode);

      ctx.session.user = user;

      // 检查是否有从群组跳转的操作参数
      if (startPayload && startPayload !== 'start' && !inviteCode) {
        // 先发送欢迎消息
        await ctx.reply(
          `🎊 欢迎使用 ${siteName}！账户已创建，正在为您执行操作...`,
          { parse_mode: 'HTML', ...(await getMainReplyKeyboard()) }
        );
        return await handleStartPayload(ctx, startPayload);
      }

      const replyMenu = await getMainReplyKeyboard();
      const sent = await contentService.sendContent(ctx, 'welcome_new_user', {
        siteName,
        username,
        telegramId,
        websiteUrl
      }, replyMenu);

      if (!sent) {
        await ctx.reply(
          `🎊 <b>欢迎使用 ${siteName}！</b>\n\n` +
          `✅ <b>账户已自动创建</b>\n` +
          `━━━━━━━━━━━━━━━\n` +
          `<code>用户名：</code>${username}\n` +
          `<code>TG ID：</code>${telegramId}\n` +
          `━━━━━━━━━━━━━━━\n\n` +
          `💡 <b>您可以直接开始使用所有功能！</b>\n\n` +
          `🌐 <b>网站同步使用</b>\n` +
          `<code>1️⃣</code> 访问 ${websiteUrl}\n` +
          `<code>2️⃣</code> 点击 "使用 Telegram 登录"\n` +
          `<code>3️⃣</code> 授权后即可同步使用\n\n` +
          `👇 请从底部选择功能`,
          { parse_mode: 'HTML', ...replyMenu }
        );
      }
    }
  } catch (error) {
    console.error('Start 命令错误:', error);
    await ctx.reply('❌ 发生错误，请稍后重试');
  }
}

// 处理扫码登录
async function handleQRLogin(ctx, token, telegramId, username, firstName, lastName, photoUrl) {
  try {
    // 🔥 关键修复：自动初始化 session 和创建/获取用户
    if (!ctx.session) {
      ctx.session = {};
    }

    // 查找或创建用户
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      // 自动创建用户，无需先 /start
      user = await User.create({
        username: username,
        email: `${telegramId}@telegram.user`,
        telegramId: telegramId,
        telegramUsername: username,
        telegramFirstName: firstName,
        telegramLastName: lastName,
        telegramBound: true,
        source: 'telegram',
        role: 'user'
      });
      await rewardService.afterUserCreated(user, '');
      console.log('✅ 自动创建用户（扫码登录）:', user.username);
    } else {
      console.log('✅ 用户已存在（扫码登录）:', user.username);
    }

    // 设置 session
    ctx.session.user = user;

    const axios = require('axios');
    const apiUrl = process.env.API_URL || 'http://localhost:5000';

    await ctx.reply(
      `🔐 <b>网站登录确认</b>\n\n` +
      `📱 检测到您正在扫码登录网站\n\n` +
      `👤 <b>账户信息</b>\n` +
      `━━━━━━━━━━━━━━━\n` +
      `<code>用户名：</code>${firstName}\n` +
      `<code>TG ID：</code>${telegramId}\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `⚠️ <b>请确认是否为您本人操作</b>\n` +
      `点击下方按钮确认登录`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ 确认登录', callback_data: `confirm_login_${token}` },
            { text: '❌ 取消', callback_data: 'cancel_login' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('处理扫码登录错误:', error);
    await ctx.reply('❌ 登录确认失败，请重试');
  }
}

// 处理登录确认回调
async function handleLoginConfirm(ctx) {
  const callbackData = ctx.callbackQuery.data;
  
  if (callbackData === 'cancel_login') {
    const cancelText = `❌ <b>登录已取消</b>\n\n` +
      `如果不是您本人操作，请注意账户安全。`;
    
    try {
      await ctx.editMessageText(cancelText, { parse_mode: 'HTML' });
    } catch (error) {
      if (error.message.includes('message to edit') || 
          error.message.includes('message is not modified')) {
        await ctx.reply(cancelText, { parse_mode: 'HTML' });
      }
    }
    await ctx.answerCbQuery('已取消登录');
    return;
  }

  if (callbackData.startsWith('confirm_login_')) {
    const token = callbackData.replace('confirm_login_', '');
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || `tg_${telegramId}`;
    const firstName = ctx.from.first_name || 'User';
    const lastName = ctx.from.last_name || '';
    
    try {
      // 🔥 关键修复：自动初始化 session 和创建/获取用户
      if (!ctx.session) {
        ctx.session = {};
      }

      // 查找或创建用户
      let user = await User.findOne({ telegramId });
      
      if (!user) {
        // 自动创建用户，无需先 /start
        user = await User.create({
          username: username,
          email: `${telegramId}@telegram.user`,
          telegramId: telegramId,
          telegramUsername: username,
          telegramFirstName: firstName,
          telegramLastName: lastName,
          telegramBound: true,
          source: 'telegram',
          role: 'user'
        });
        await rewardService.afterUserCreated(user, '');
        console.log('✅ 自动创建用户（登录确认）:', user.username);
      } else {
        // 更新用户信息
        user.telegramUsername = username;
        user.telegramFirstName = firstName;
        user.telegramLastName = lastName;
        await user.save();
        console.log('✅ 更新用户信息（登录确认）:', user.username);
      }

      // 设置 session
      ctx.session.user = user;

      const axios = require('axios');
      // 使用 localhost 而不是外部域名，确保内部调用
      const apiUrl = 'http://localhost:5000';
      
      console.log('🔐 确认登录请求:', {
        token,
        telegramId,
        username,
        apiUrl
      });
      
      // 调用后端 API 确认登录
      const response = await axios.post(`${apiUrl}/api/auth/confirm-qr-login`, {
        token,
        telegramId,
        username,
        firstName,
        lastName
      });

      console.log('✅ 登录确认成功:', response.data);

      const successText = `✅ <b>登录成功！</b>\n\n` +
        `🎉 您已成功登录网站\n` +
        `请返回浏览器查看`;

      try {
        await ctx.editMessageText(successText, { parse_mode: 'HTML' });
      } catch (error) {
        if (error.message.includes('message to edit') || 
            error.message.includes('message is not modified')) {
          await ctx.reply(successText, { parse_mode: 'HTML' });
        }
      }
      await ctx.answerCbQuery('登录成功！');
    } catch (error) {
      console.error('❌ 确认登录错误:', error.message);
      console.error('错误详情:', error.response?.data || error);
      
      const errorText = `❌ <b>登录失败</b>\n\n` +
        `请重新扫码或稍后重试\n` +
        `错误: ${error.message}`;

      try {
        await ctx.editMessageText(errorText, { parse_mode: 'HTML' });
      } catch (editError) {
        if (editError.message.includes('message to edit') || 
            editError.message.includes('message is not modified')) {
          await ctx.reply(errorText, { parse_mode: 'HTML' });
        }
      }
      await ctx.answerCbQuery('登录失败，请重试');
    }
  }
}

// /menu：刷新输入框上方的常驻功能键
async function menu(ctx) {
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.user) {
    return start(ctx);
  }
  delete ctx.session.state;
  delete ctx.session.paymentData;
  delete ctx.session.withdrawData;
  await sendFunctionMenu(ctx);
}

// /help 命令处理
async function help(ctx) {
  const settings = await Settings.findOne();
  const siteName = settings?.siteName || '可可代付';
  const telegramCustomerService = settings?.telegramCustomerService || '';
  const appUrl = process.env.APP_URL || 'https://kk.vpno.eu.org';

  // 尝试使用自定义内容
  const contentService = require('../services/contentService');
  const sent = await contentService.sendContent(ctx, 'help_center', {
    siteName,
    customerService: telegramCustomerService,
    websiteUrl: appUrl
  }, getBackKeyboard());

  // 如果没有自定义内容，使用默认消息
  if (!sent) {
    let helpText = `❓ <b>帮助中心</b>\n\n` +
      `📖 <b>使用说明</b>\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `💰 <b>代付服务</b>\n` +
      `<code>•</code> 支持 USDT 和 TRX 代付\n` +
      `<code>•</code> 输入数量和地址即可\n` +
      `<code>•</code> 支持微信和支付宝支付\n` +
      `<code>•</code> 2-10分钟内完成\n\n` +
      `📋 <b>订单查询</b>\n` +
      `<code>•</code> 查看所有历史订单\n` +
      `<code>•</code> 实时查看订单状态\n` +
      `<code>•</code> 查看交易哈希\n\n` +
      `🔔 <b>通知功能</b>\n` +
      `<code>•</code> 支付成功自动通知\n` +
      `<code>•</code> 代付完成自动通知\n` +
      `<code>•</code> 无需手动刷新\n\n` +
      `🎁 <b>签到 / 邀请 / 提现</b>\n` +
      `<code>•</code> 每日签到领 TRX\n` +
      `<code>•</code> 邀请好友得 TRX，下级消费返 USDT\n` +
      `<code>•</code> USDT 奖励可申请提现\n\n`;

    if (telegramCustomerService) {
      helpText += `💬 <b>需要帮助？</b>\n` +
        `联系客服：${telegramCustomerService}\n\n`;
    }

    helpText += `🌐 <b>网站地址</b>\n${appUrl}`;

    await ctx.reply(helpText, { 
      parse_mode: 'HTML',
      ...getBackKeyboard() 
    });
  }
}

// /cancel 命令处理
async function cancel(ctx) {
  // 清除会话状态
  if (ctx.session) {
    delete ctx.session.state;
    delete ctx.session.paymentData;
    delete ctx.session.withdrawData;
  }

  await sendFunctionMenu(ctx);
}

// 个人中心
async function accountInfo(ctx) {
  const user = ctx.session?.user;
  if (!user) {
    return ctx.reply('请先使用 /start 命令');
  }

  // 获取用户统计
  const Payment = require('../../models/Payment');
  const totalOrders = await Payment.countDocuments({ 
    $or: [
      { userId: user._id },
      { telegramId: user.telegramId }
    ]
  });
  
  const completedOrders = await Payment.countDocuments({ 
    $or: [
      { userId: user._id },
      { telegramId: user.telegramId }
    ],
    status: 'completed'
  });

  const accountVars = {
    username: user.username,
    email: user.email || '未设置',
    telegramId: String(user.telegramId || ''),
    createdAt: new Date(user.createdAt).toLocaleDateString('zh-CN'),
    totalOrders,
    completedOrders,
    pendingOrders: totalOrders - completedOrders
  };

  const { Markup } = require('telegraf');
  const accountKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📧 修改邮箱', 'change_email')],
    [
      Markup.button.callback('📅 签到', 'reward_checkin'),
      Markup.button.callback('🎁 邀请', 'reward_invite'),
      Markup.button.callback('💸 提现', 'reward_withdraw')
    ],
    [Markup.button.callback('« 返回主菜单', 'back_to_main')]
  ]);
  const sent = await contentService.sendContent(ctx, 'account_info', accountVars, accountKeyboard);
  if (sent) return;

  const accountText = `👤 <b>个人中心</b>\n\n` +
    `📊 <b>账户信息</b>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `<code>用户名：</code>${user.username}\n` +
    `<code>邮  箱：</code>${user.email || '未设置'}\n` +
    `<code>TG ID：</code>${user.telegramId}\n` +
    `<code>注册于：</code>${new Date(user.createdAt).toLocaleDateString('zh-CN')}\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `📈 <b>订单统计</b>\n` +
    `<code>📦 总订单：</code>${totalOrders}\n` +
    `<code>✅ 已完成：</code>${completedOrders}\n` +
    `<code>🔄 处理中：</code>${totalOrders - completedOrders}\n\n` +
    `💡 点击下方按钮修改邮箱`;

  const options = { 
    parse_mode: 'HTML',
    ...accountKeyboard
  };

  try {
    // 尝试编辑消息（如果是文本消息）
    await ctx.editMessageText(accountText, options);
  } catch (error) {
    // 如果编辑失败（比如是图片消息或消息内容相同），发送新消息
    if (error.message.includes('message to edit') || 
        error.message.includes('message is not modified')) {
      await ctx.reply(accountText, options);
    } else {
      console.error('显示个人中心失败:', error);
      throw error;
    }
  }

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
  }
}

// 修改邮箱 - 请求输入新邮箱
async function changeEmail(ctx) {
  const user = ctx.session?.user;
  if (!user) {
    return ctx.reply('请先使用 /start 命令');
  }

  ctx.session.state = 'waiting_new_email';

  const message = `📧 <b>修改邮箱</b>\n\n` +
    `<code>当前邮箱：</code>${user.email || '未设置'}\n\n` +
    `📝 请输入新的邮箱地址\n` +
    `<i>用于接收订单通知和重要消息</i>\n\n` +
    `💡 <b>示例：</b>\n` +
    `<code>user@example.com</code>`;

  const { Markup } = require('telegraf');
  const options = { 
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('« 取消', 'account_info')]
    ])
  };

  try {
    await ctx.editMessageText(message, options);
  } catch (error) {
    if (error.message.includes('message to edit') || 
        error.message.includes('message is not modified')) {
      await ctx.reply(message, options);
    } else {
      throw error;
    }
  }

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
  }
}

// 处理新邮箱输入
async function handleNewEmail(ctx) {
  const email = ctx.message.text.trim();
  const user = ctx.session?.user;

  if (!user) {
    return ctx.reply('请先使用 /start 命令');
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ctx.reply(
      `❌ <b>邮箱格式不正确</b>\n\n` +
      `请输入有效的邮箱地址，例如：\n` +
      `<code>user@example.com</code>`,
      { parse_mode: 'HTML' }
    );
  }

  try {
    // 检查邮箱是否已被其他用户使用
    const User = require('../../models/User');
    const existingUser = await User.findOne({ 
      email: email,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return ctx.reply(
        `❌ <b>邮箱已被使用</b>\n\n` +
        `该邮箱已被其他用户绑定\n` +
        `请使用其他邮箱地址`,
        { parse_mode: 'HTML' }
      );
    }

    // 更新用户邮箱
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { email: email },
      { new: true }
    );

    // 更新 session 中的用户信息
    ctx.session.user = updatedUser;

    // 清除状态
    delete ctx.session.state;

    const { Markup } = require('telegraf');
    await ctx.reply(
      `✅ <b>邮箱修改成功！</b>\n\n` +
      `<code>新邮箱：</code>${email}\n\n` +
      `📬 您将在此邮箱接收订单通知`,
      { 
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('👤 返回个人中心', 'account_info')],
          [Markup.button.callback('« 返回主菜单', 'back_to_main')]
        ])
      }
    );

    console.log(`✅ 用户 ${user.telegramId} 邮箱已更新: ${email}`);
  } catch (error) {
    console.error('更新邮箱失败:', error);
    await ctx.reply(
      `❌ <b>更新失败</b>\n\n` +
      `${error.message}\n\n` +
      `请稍后重试或联系客服`,
      { parse_mode: 'HTML' }
    );
  }
}

// 处理返回按钮
async function handleBack(ctx) {
  if (ctx.session) {
    delete ctx.session.state;
    delete ctx.session.paymentData;
    delete ctx.session.withdrawData;
  }
  await sendFunctionMenu(ctx);
}

function unwrapAction(action) {
  const raw = String(action || '').trim();
  if (raw.startsWith('scene:')) return { kind: 'scene', value: raw.slice(6) };
  if (raw.startsWith('action:')) return { kind: 'action', value: raw.slice(7) };
  return { kind: 'auto', value: raw };
}

async function dispatchAction(ctx, action) {
  const parsed = unwrapAction(action);
  if (!parsed.value) return false;
  if (parsed.kind === 'scene') {
    const sent = await contentService.sendContent(ctx, parsed.value, {}, getBackKeyboard());
    if (sent && ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});
    return !!sent;
  }
  return runMenuAction(ctx, parsed.value);
}

async function runMenuAction(ctx, action) {
  const paymentHandler = require('./payment');
  const ordersHandler = require('./orders');
  const ticketsHandler = require('./tickets');
  const energyHandler = require('./energy');
  const swapHandler = require('./swap');
  const rewardsHandler = require('./rewards');

  switch (action) {
    case 'payment_usdt':
      await paymentHandler.handleUSDTPayment(ctx);
      return true;
    case 'payment_trx':
      await paymentHandler.handleTRXPayment(ctx);
      return true;
    case 'orders_list':
    case 'my_orders':
      await ordersHandler.showOrdersList(ctx);
      return true;
    case 'tickets_list': {
      const prev = ctx.callbackQuery;
      ctx.callbackQuery = { data: 'tickets_list', from: ctx.from, message: ctx.message };
      try {
        await ticketsHandler.handleCallback(ctx);
      } finally {
        ctx.callbackQuery = prev;
      }
      return true;
    }
    case 'create_ticket':
      await ticketsHandler.startCreateTicket(ctx);
      return true;
    case 'energy_rental':
      await energyHandler.start(ctx);
      return true;
    case 'swap_service':
      await swapHandler.start(ctx);
      return true;
    case 'checkin':
    case 'reward_checkin':
      await rewardsHandler.showCheckin(ctx);
      return true;
    case 'invite':
    case 'reward_invite':
      await rewardsHandler.showInvite(ctx);
      return true;
    case 'withdraw':
    case 'reward_withdraw':
      await rewardsHandler.showWithdraw(ctx);
      return true;
    case 'account_info':
      await accountInfo(ctx);
      return true;
    case 'help':
    case 'help_center':
      await help(ctx);
      return true;
    case 'menu':
    case 'back_to_main':
    case 'back_main':
      await menu(ctx);
      return true;
    default: {
      const sent = await contentService.sendContent(ctx, action, {}, getBackKeyboard());
      if (sent) {
        if (ctx.callbackQuery) await ctx.answerCbQuery().catch(() => {});
        return true;
      }
      return false;
    }
  }
}

// 处理从群组跳转的操作参数
async function handleStartPayload(ctx, payload) {
  console.log(`🔗 处理群组跳转参数: ${payload}`);

  try {
    const handled = await dispatchAction(ctx, payload);
    if (!handled) {
      console.log(`⚠️  未知操作参数: ${payload}`);
      return await menu(ctx);
    }
  } catch (error) {
    console.error('处理群组跳转参数失败:', error);
    await ctx.reply(
      '❌ 操作失败，请重试',
      await getMainReplyKeyboard()
    );
  }
}

module.exports = {
  start,
  menu,
  help,
  cancel,
  handleBack,
  handleLoginConfirm,
  accountInfo,
  changeEmail,
  handleNewEmail,
  runMenuAction,
  dispatchAction
};
