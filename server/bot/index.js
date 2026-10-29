const { Telegraf, session } = require('telegraf');
const User = require('../models/User');
const Settings = require('../models/Settings');
const contentService = require('./services/contentService');
const { registerCustomCommands, handleCommand, initializeDefaultCommands } = require('./commandHandler');

// 导入处理器
const startHandler = require('./handlers/start');
const paymentHandler = require('./handlers/payment');
const ordersHandler = require('./handlers/orders');
const ticketsHandler = require('./handlers/tickets');
const energyHandler = require('./handlers/energy');
const swapHandler = require('./handlers/swap');

class TelegramBot {
  constructor() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.log('⚠️  未配置 TELEGRAM_BOT_TOKEN，跳过 Bot 启动');
      return;
    }

    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.setupMiddleware();
    this.setupHandlers();
  }

  setupMiddleware() {
    // Session 中间件 - 使用默认内存存储
    this.bot.use(session({
      defaultSession: () => ({})
    }));

    // 日志中间件
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      const updateType = ctx.updateType;
      const text = ctx.message?.text;
      console.log(`📥 收到更新: ${updateType}${text ? ` - "${text}"` : ''}`);
      await next();
      const ms = Date.now() - start;
      console.log(`📱 TG: ${updateType} - ${ms}ms`);
    });

    // 用户认证中间件
    this.bot.use(async (ctx, next) => {
      // 确保 session 已初始化
      if (!ctx.session) {
        ctx.session = {};
      }

      // 检查是否是群组消息
      const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
      
      // 如果是群组消息且不是 /start 命令，引导用户私聊
      if (isGroup && !ctx.message?.text?.startsWith('/start')) {
        const telegramId = ctx.from?.id?.toString();
        const botUsername = this.bot.botInfo?.username || 'bot';
        
        // 只对命令和回调查询做出响应，忽略普通文本消息
        if (ctx.message?.text?.startsWith('/') || ctx.callbackQuery) {
          const { Markup } = require('telegraf');
          
          // 获取用户想要执行的操作
          let action = 'start';
          if (ctx.callbackQuery) {
            action = ctx.callbackQuery.data || 'start';
          } else if (ctx.message?.text) {
            const command = ctx.message.text.split(' ')[0].replace('/', '');
            action = command;
          }
          
          const message = `🔒 <b>隐私保护</b>\n\n` +
            `为了保护您的账户安全和隐私信息，所有操作需要在私聊中进行。\n\n` +
            `👇 点击下方按钮，我会在私聊中为您继续操作`;
          
          try {
            if (ctx.callbackQuery) {
              // 回调查询：先回答，再发送消息
              await ctx.answerCbQuery('请点击按钮跳转到私聊 🔒');
              await ctx.reply(message, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                  [Markup.button.url('💬 跳转到私聊', `https://t.me/${botUsername}?start=${action}`)]
                ])
              });
            } else {
              // 命令：发送提示消息
              await ctx.reply(message, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                  [Markup.button.url('💬 跳转到私聊', `https://t.me/${botUsername}?start=${action}`)]
                ])
              });
            }
          } catch (error) {
            console.error('发送群组提示失败:', error);
          }
          
          return; // 不继续处理
        }
        
        // 普通文本消息：静默忽略
        return;
      }

      // /start 命令不需要认证
      if (ctx.message?.text?.startsWith('/start')) {
        return next();
      }

      // 获取或创建用户（仅私聊）
      if (!ctx.session.user) {
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) {
          return next();
        }

        const user = await User.findOne({ telegramId });
        
        if (user) {
          ctx.session.user = user;
        } else {
          // 未找到用户，提示使用 /start
          return ctx.reply(
            '❌ 请先使用 /start 命令开始使用',
            { reply_markup: { remove_keyboard: true } }
          );
        }
      }

      return next();
    });
  }

  setupHandlers() {
    // 命令处理（保留作为备用）
    this.bot.command('start', startHandler.start);
    this.bot.command('menu', startHandler.menu);
    this.bot.command('help', startHandler.help);
    this.bot.command('cancel', startHandler.cancel);
    
    // 群组/频道消息监听（自动记录）
    this.bot.on('my_chat_member', this.handleChatMemberUpdate.bind(this));
    
    // 统一的文本消息处理器（处理命令和用户输入）
    console.log('✅ 注册统一文本消息处理器');
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      console.log(`🔍 收到文本: "${text}"`);
      
      // 先更新群组消息统计（如果是群组消息）
      await this.handleGroupMessage(ctx);
      
      // 1. 检查是否是命令
      if (text && text.startsWith('/')) {
        console.log('  → 这是命令，调用 handleCommand');
        const handled = await handleCommand(ctx, text);
        if (handled) {
          console.log('  → 命令已处理');
          return;
        }
        console.log('  → 命令未处理，继续');
      }
      
      // 2. 处理用户输入
      console.log('  → 调用 handleText 处理用户输入');
      await this.handleText(ctx);
    });
    // 注意：登录相关的回调必须在 confirm_ 之前注册，避免被 payment 处理器捕获
    this.bot.action(/^confirm_login_/, startHandler.handleLoginConfirm);
    this.bot.action('cancel_login', startHandler.handleLoginConfirm);
    
    // 通用回调（放在前面，优先匹配）
    this.bot.action(/^back_/, startHandler.handleBack);
    this.bot.action('cancel', startHandler.cancel);
    this.bot.action('help_center', startHandler.help);
    this.bot.action('account_info', startHandler.accountInfo);
    this.bot.action('change_email', startHandler.changeEmail);
    
    // 支付相关回调
    this.bot.action(/^payment_/, paymentHandler.handleCallback);
    this.bot.action(/^confirm_payment/, paymentHandler.handleCallback);  // 更精确的匹配
    this.bot.action(/^pay_/, paymentHandler.handleCallback);
    this.bot.action(/^check_order_/, paymentHandler.handleCallback);
    
    // 其他功能回调
    this.bot.action(/^orders_/, ordersHandler.handleCallback);
    this.bot.action(/^order_/, ordersHandler.handleCallback);
    this.bot.action(/^tickets_/, ticketsHandler.handleCallback);
    this.bot.action(/^ticket_/, ticketsHandler.handleCallback);
    this.bot.action(/^energy_/, energyHandler.handleCallback);
    this.bot.action(/^swap_/, swapHandler.handleCallback);
    this.bot.action('energy_rental', energyHandler.handleCallback);
    this.bot.action('swap_service', swapHandler.handleCallback);
    this.bot.action(/^copy_/, async (ctx) => {
      const data = ctx.callbackQuery.data.replace('copy_', '');
      await contentService.handleCopyButton(ctx, data);
    });

    // 错误处理
    this.bot.catch((err, ctx) => {
      console.error('❌ Bot 错误:', err);
      ctx.reply('❌ 发生错误，请稍后重试或联系客服');
    });
  }

  // 处理 Bot 被添加/移除群组
  async handleChatMemberUpdate(ctx) {
    const TelegramGroup = require('../models/TelegramGroup');
    const chat = ctx.chat;
    const newStatus = ctx.myChatMember.new_chat_member.status;

    try {
      if (newStatus === 'member' || newStatus === 'administrator') {
        // Bot 被添加到群组或成为管理员
        const groupData = {
          chatId: chat.id.toString(),
          title: chat.title || 'Unknown',
          type: chat.type,
          username: chat.username,
          botStatus: newStatus === 'administrator' ? 'admin' : 'member',
          active: true,
          lastMessageAt: new Date()
        };

        // 如果是管理员，获取权限
        if (newStatus === 'administrator') {
          const member = ctx.myChatMember.new_chat_member;
          groupData.botPermissions = {
            canSendMessages: member.can_send_messages || false,
            canDeleteMessages: member.can_delete_messages || false,
            canPinMessages: member.can_pin_messages || false,
            canInviteUsers: member.can_invite_users || false
          };
        }

        await TelegramGroup.findOneAndUpdate(
          { chatId: chat.id.toString() },
          groupData,
          { upsert: true, new: true }
        );

        console.log(`✅ Bot 加入群组: ${chat.title} (${chat.id})`);
      } else if (newStatus === 'left' || newStatus === 'kicked') {
        // Bot 被移除
        await TelegramGroup.findOneAndUpdate(
          { chatId: chat.id.toString() },
          { botStatus: 'left', active: false },
          { new: true }
        );

        console.log(`❌ Bot 离开群组: ${chat.title} (${chat.id})`);
      }
    } catch (error) {
      console.error('处理群组状态更新失败:', error);
    }
  }

  // 处理群组消息（更新活跃状态）
  async handleGroupMessage(ctx) {
    const chat = ctx.chat;
    
    // 只处理群组和频道消息
    if (chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel') {
      const TelegramGroup = require('../models/TelegramGroup');
      
      try {
        await TelegramGroup.findOneAndUpdate(
          { chatId: chat.id.toString() },
          {
            $set: {
              title: chat.title,
              username: chat.username,
              lastMessageAt: new Date(),
              active: true
            },
            $inc: { messageCount: 1 }
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error('更新群组信息失败:', error);
      }
    }
  }

  async handleText(ctx) {
    console.log('🎯 ========== handleText 被调用 ==========');
    const user = ctx.session?.user;
    if (!user) {
      console.log('❌ 用户未登录');
      return ctx.reply('请先使用 /start 命令');
    }

    const state = ctx.session?.state;
    const text = ctx.message?.text;
    
    console.log('📝 收到文本消息:', text);
    console.log('📊 当前状态:', state);
    console.log('👤 用户:', user?.username);
    console.log('🔑 Session keys:', Object.keys(ctx.session));
    
    switch (state) {
      case 'waiting_usdt_amount':
        console.log('✅ 处理 USDT 数量');
        return paymentHandler.handleUSDTAmount(ctx);
      case 'waiting_trx_amount':
        console.log('✅ 处理 TRX 数量');
        return paymentHandler.handleTRXAmount(ctx);
      case 'waiting_usdt_address':
        console.log('✅ 处理 USDT 地址');
        return paymentHandler.handleUSDTAddress(ctx);
      case 'waiting_trx_address':
        console.log('✅ 处理 TRX 地址');
        return paymentHandler.handleTRXAddress(ctx);
      case 'waiting_ticket_subject':
        console.log('✅ 处理工单标题');
        return ticketsHandler.handleTicketSubject(ctx);
      case 'waiting_ticket_description':
        console.log('✅ 处理工单描述');
        return ticketsHandler.handleTicketDescription(ctx);
      case 'waiting_ticket_reply':
        console.log('✅ 处理工单回复');
        return ticketsHandler.handleTicketReply(ctx);
      case 'waiting_new_email':
        console.log('✅ 处理新邮箱');
        return startHandler.handleNewEmail(ctx);
      case 'waiting_trx_deposit_hash':
        return energyHandler.handleDepositHash(ctx);
      case 'waiting_energy_balance_address':
        return energyHandler.handleBalanceAddress(ctx);
      case 'waiting_energy_balance_amount':
        return energyHandler.handleBalanceAmount(ctx);
      default:
        console.log('⚠️  未知状态，显示默认消息');
        return ctx.reply(
          '💡 请使用菜单选择功能，或发送 /menu 查看菜单',
          await startHandler.getMainKeyboard()
        );
    }
  }

  async start() {
    if (!this.bot) return;

    try {
      // 初始化默认命令（首次运行）
      await initializeDefaultCommands();
      
      // 注册自定义命令到 Telegram
      await registerCustomCommands(this.bot);
      
      // 启动 Bot
      await this.bot.launch();
      console.log('🤖 Telegram Bot 已启动');

      // 优雅关闭
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      console.error('❌ Bot 启动失败:', error);
    }
  }

  // 重新加载命令（用于后台更新命令后刷新）
  async reloadCommands() {
    if (!this.bot) return;
    
    try {
      await registerCustomCommands(this.bot);
      console.log('✅ 已重新加载 Bot 命令');
    } catch (error) {
      console.error('❌ 重新加载命令失败:', error);
    }
  }

  // 发送通知的方法
  async sendNotification(telegramId, message, options = {}) {
    if (!this.bot) return;
    
    try {
      await this.bot.telegram.sendMessage(telegramId, message, options);
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  // 发送图片通知
  async sendPhoto(telegramId, photo, options = {}) {
    if (!this.bot) return;
    
    try {
      await this.bot.telegram.sendPhoto(telegramId, photo, options);
    } catch (error) {
      console.error('发送图片失败:', error);
    }
  }
}

// 导出单例
let botInstance = null;

function getBotInstance() {
  if (!botInstance) {
    botInstance = new TelegramBot();
  }
  return botInstance;
}

module.exports = { TelegramBot, getBotInstance };
