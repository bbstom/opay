const { Telegraf, session } = require('telegraf');
const User = require('../models/User');
const Settings = require('../models/Settings');
const contentService = require('./services/contentService');
const { registerCustomCommands, handleCommand, initializeDefaultCommands } = require('./commandHandler');
const { getEnabledTelegramBots } = require('../utils/telegramBots');

// 导入处理器
const startHandler = require('./handlers/start');
const paymentHandler = require('./handlers/payment');
const ordersHandler = require('./handlers/orders');
const ticketsHandler = require('./handlers/tickets');
const energyHandler = require('./handlers/energy');
const swapHandler = require('./handlers/swap');

/**
 * 多 Bot 管理器
 * 支持同时运行多个 Telegram Bot 实例
 */
class MultiBotManager {
  constructor() {
    this.bots = [];
    this.shutdownHooked = false;
    this.reloadQueue = Promise.resolve();
  }

  /**
   * 从数据库加载已启用且填了 Token 的 Bot
   */
  async loadBotsFromDb() {
    const settings = await Settings.findOne();
    const configs = getEnabledTelegramBots(settings);
    if (!configs.length) {
      console.log('⚠️  未在后台配置 Telegram Bot Token，跳过 Bot 启动');
      return;
    }

    console.log(`🤖 从数据库加载 ${configs.length} 个 Bot 配置`);
    configs.forEach((cfg, index) => {
      this.createBot(cfg.token, cfg.username || 'bot', index + 1);
    });
  }

  /**
   * 创建单个 Bot 实例
   */
  createBot(token, username, index) {
    try {
      const bot = new Telegraf(token);
      
      // 设置 Bot 信息
      bot.botUsername = username;
      bot.botIndex = index;

      // 设置中间件
      this.setupMiddleware(bot);
      
      // 设置处理器
      this.setupHandlers(bot);

      this.bots.push({
        bot,
        username,
        index
      });

      console.log(`✅ Bot #${index} 已初始化: @${username}`);
    } catch (error) {
      console.error(`❌ Bot #${index} 初始化失败:`, error);
    }
  }

  /**
   * 设置中间件
   */
  setupMiddleware(bot) {
    // Session 中间件
    bot.use(session({
      defaultSession: () => ({})
    }));

    // 日志中间件
    bot.use(async (ctx, next) => {
      const start = Date.now();
      const updateType = ctx.updateType;
      const text = ctx.message?.text;
      const botUsername = bot.botUsername;
      console.log(`📥 [@${botUsername}] 收到更新: ${updateType}${text ? ` - "${text}"` : ''}`);
      await next();
      const ms = Date.now() - start;
      console.log(`📱 [@${botUsername}] TG: ${updateType} - ${ms}ms`);
    });

    // 用户认证中间件
    bot.use(async (ctx, next) => {
      if (!ctx.session) {
        ctx.session = {};
      }

      const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
      
      // 群组消息处理
      if (isGroup && !ctx.message?.text?.startsWith('/start')) {
        const telegramId = ctx.from?.id?.toString();
        const botUsername = bot.botUsername;
        
        if (ctx.message?.text?.startsWith('/') || ctx.callbackQuery) {
          const { Markup } = require('telegraf');
          
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
              await ctx.answerCbQuery('请点击按钮跳转到私聊 🔒');
              await ctx.reply(message, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                  [Markup.button.url('💬 跳转到私聊', `https://t.me/${botUsername}?start=${action}`)]
                ])
              });
            } else {
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
          
          return;
        }
        
        return;
      }

      // /start 命令不需要认证
      if (ctx.message?.text?.startsWith('/start')) {
        return next();
      }

      // 获取或创建用户
      if (!ctx.session.user) {
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) {
          return next();
        }

        const user = await User.findOne({ telegramId });
        
        if (user) {
          ctx.session.user = user;
        } else {
          return ctx.reply(
            '❌ 请先使用 /start 命令开始使用',
            { reply_markup: { remove_keyboard: true } }
          );
        }
      }

      return next();
    });
  }

  /**
   * 设置处理器
   */
  setupHandlers(bot) {
    // 命令处理
    bot.command('start', startHandler.start);
    bot.command('menu', startHandler.menu);
    bot.command('help', startHandler.help);
    bot.command('cancel', startHandler.cancel);
    
    // 群组/频道消息监听
    bot.on('my_chat_member', this.handleChatMemberUpdate.bind(this));
    
    // 统一的文本消息处理器
    bot.on('text', async (ctx) => {
      const text = ctx.message.text;
      
      // 先更新群组消息统计
      await this.handleGroupMessage(ctx);
      
      // 检查是否是命令
      if (text && text.startsWith('/')) {
        const commandName = text.split(' ')[0].substring(1).split('@')[0];
        const handled = await handleCommand(ctx, commandName);
        if (handled) return;
      }
      
      // 处理用户输入
      await this.handleText(ctx);
    });

    // 回调查询处理
    bot.on('callback_query', async (ctx) => {
      try {
        const data = ctx.callbackQuery.data;
        console.log(`🔍 [@${bot.botUsername}] 收到回调: ${data}`);
        
        // 通用回调（必须在前面）
        if (data === 'back_to_main') {
          console.log(`✅ [@${bot.botUsername}] 处理返回主菜单`);
          return startHandler.handleBack(ctx);
        }
        
        // 功能回调
        if (data.startsWith('payment_') || data === 'confirm_payment' || data.startsWith('pay_') || data.startsWith('check_order_')) {
          return paymentHandler.handleCallback(ctx);
        }
        
        if (data.startsWith('order') || data === 'my_orders') {
          return ordersHandler.handleCallback(ctx);
        }
        
        if (data.startsWith('ticket') || data === 'create_ticket') {
          return ticketsHandler.handleCallback(ctx);
        }
        
        if (data.startsWith('energy') || data === 'energy_rental') {
          return energyHandler.handleCallback(ctx);
        }
        
        if (data.startsWith('swap') || data === 'swap_service') {
          return swapHandler.handleCallback(ctx);
        }
        
        if (data === 'account_info' || data === 'change_email') {
          if (data === 'account_info') {
            return startHandler.accountInfo(ctx);
          } else if (data === 'change_email') {
            return startHandler.changeEmail(ctx);
          }
        }
        
        if (data === 'help_center') {
          return startHandler.help(ctx);
        }
        
        if (data.startsWith('confirm_login_') || data === 'cancel_login') {
          return startHandler.handleLoginConfirm(ctx);
        }
        
        console.log(`❌ [@${bot.botUsername}] 未知操作: ${data}`);
        await ctx.answerCbQuery('未知操作').catch(() => {});
      } catch (error) {
        // 忽略回调查询超时错误
        if (error.message && error.message.includes('query is too old')) {
          console.log(`⚠️  [@${bot.botUsername}] 回调查询已超时（可忽略）`);
        } else {
          console.error(`❌ [@${bot.botUsername}] 回调处理错误:`, error.message);
        }
      }
    });
  }

  /**
   * 处理文本消息
   */
  async handleText(ctx) {
    const user = ctx.session?.user;
    if (!user) {
      return ctx.reply('请先使用 /start 命令');
    }

    const state = ctx.session?.state;
    
    switch (state) {
      case 'waiting_usdt_amount':
        return paymentHandler.handleUSDTAmount(ctx);
      case 'waiting_trx_amount':
        return paymentHandler.handleTRXAmount(ctx);
      case 'waiting_usdt_address':
        return paymentHandler.handleUSDTAddress(ctx);
      case 'waiting_trx_address':
        return paymentHandler.handleTRXAddress(ctx);
      case 'waiting_ticket_subject':
        return ticketsHandler.handleTicketSubject(ctx);
      case 'waiting_ticket_description':
        return ticketsHandler.handleTicketDescription(ctx);
      case 'waiting_ticket_reply':
        return ticketsHandler.handleTicketReply(ctx);
      case 'waiting_new_email':
        return startHandler.handleNewEmail(ctx);
      case 'waiting_trx_deposit_hash':
        return energyHandler.handleDepositHash(ctx);
      case 'waiting_energy_balance_address':
        return energyHandler.handleBalanceAddress(ctx);
      case 'waiting_energy_balance_amount':
        return energyHandler.handleBalanceAmount(ctx);
      default:
        return ctx.reply(
          '💡 请使用菜单选择功能，或发送 /menu 查看菜单',
          await startHandler.getMainKeyboard()
        );
    }
  }

  /**
   * 处理 Bot 被添加/移除群组
   */
  async handleChatMemberUpdate(ctx) {
    const TelegramGroup = require('../models/TelegramGroup');
    const chat = ctx.chat;
    const newStatus = ctx.myChatMember.new_chat_member.status;

    try {
      if (newStatus === 'member' || newStatus === 'administrator') {
        const groupData = {
          chatId: chat.id.toString(),
          title: chat.title || 'Unknown',
          type: chat.type,
          username: chat.username,
          botStatus: newStatus === 'administrator' ? 'admin' : 'member',
          active: true,
          joinedAt: new Date()
        };

        if (newStatus === 'administrator') {
          const member = ctx.myChatMember.new_chat_member;
          groupData.botPermissions = {
            canSendMessages: member.can_send_messages || false,
            canDeleteMessages: member.can_delete_messages || false,
            canPinMessages: member.can_pin_messages || false
          };
        }

        await TelegramGroup.findOneAndUpdate(
          { chatId: chat.id.toString() },
          groupData,
          { upsert: true, new: true }
        );

        console.log(`✅ Bot 已加入群组: ${chat.title}`);
      } else if (newStatus === 'left' || newStatus === 'kicked') {
        await TelegramGroup.findOneAndUpdate(
          { chatId: chat.id.toString() },
          { botStatus: 'left', active: false },
          { new: true }
        );

        console.log(`❌ Bot 已离开群组: ${chat.title}`);
      }
    } catch (error) {
      console.error('处理群组更新失败:', error);
    }
  }

  /**
   * 处理群组消息
   */
  async handleGroupMessage(ctx) {
    const chat = ctx.chat;
    
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

  hookShutdown() {
    if (this.shutdownHooked) return;
    this.shutdownHooked = true;
    process.once('SIGINT', () => this.stop('SIGINT'));
    process.once('SIGTERM', () => this.stop('SIGTERM'));
  }

  /**
   * 启动所有 Bot（从数据库读 Token）
   */
  async start() {
    this.hookShutdown();
    await this.reloadFromDb();
  }

  /**
   * 按数据库配置重建 Bot（保存后台 Token 后调用）
   */
  reloadFromDb() {
    this.reloadQueue = this.reloadQueue
      .then(() => this._reloadFromDb())
      .catch((error) => {
        console.error('❌ 按数据库配置加载 Bot 失败:', error);
      });
    return this.reloadQueue;
  }

  async _reloadFromDb() {
    await this.stopRunning('reload');
    await this.loadBotsFromDb();
    await this.launchBots();
  }

  async launchBots() {
    if (this.bots.length === 0) {
      console.log('⚠️  没有可用的 Bot 实例');
      return;
    }

    try {
      await initializeDefaultCommands();

      const launchPromises = this.bots.map(async (botInstance) => {
        const { bot, username, index } = botInstance;

        try {
          console.log(`🔄 正在启动 Bot #${index}: @${username}...`);
          await registerCustomCommands(bot);

          bot.launch().then(() => {
            console.log(`🤖 Bot #${index} 已启动: @${username}`);
          }).catch((error) => {
            if (error.message && error.message.includes('query is too old')) {
              console.log(`⚠️  Bot #${index} (@${username}) 启动时有旧回调超时（可忽略）`);
            } else {
              console.error(`❌ Bot #${index} (@${username}) 启动失败:`, error.message);
            }
          });

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Bot #${index} (@${username}) 初始化失败:`, error.message);
        }
      });

      await Promise.all(launchPromises);
      console.log(`✅ 所有 Bot 已启动 (共 ${this.bots.length} 个)`);
    } catch (error) {
      console.error('❌ Bot 启动失败:', error);
    }
  }

  async stopRunning(reason = 'stop') {
    const running = this.bots;
    this.bots = [];
    await Promise.all(running.map(async ({ bot, username }) => {
      try {
        await Promise.resolve(bot.stop(reason));
        console.log(`✅ Bot @${username} 已停止`);
      } catch (_) {
        // 未启动或已停止时忽略
      }
    }));
  }

  /**
   * 停止所有 Bot
   */
  stop(signal) {
    console.log(`\n🛑 收到 ${signal} 信号，正在停止所有 Bot...`);
    this.stopRunning(signal).catch(() => {});
  }

  /**
   * 重新加载命令
   */
  async reloadCommands() {
    for (const { bot, username } of this.bots) {
      try {
        await registerCustomCommands(bot);
        console.log(`✅ Bot @${username} 命令已重新加载`);
      } catch (error) {
        console.error(`❌ Bot @${username} 重新加载命令失败:`, error);
      }
    }
  }

  /**
   * 发送通知（使用第一个 Bot）
   */
  async sendNotification(telegramId, message, options = {}) {
    if (this.bots.length === 0) return;
    
    const { bot } = this.bots[0];
    try {
      await bot.telegram.sendMessage(telegramId, message, options);
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  /**
   * 获取 Bot 实例（用于通知服务）
   */
  getBotInstance() {
    if (this.bots.length === 0) return null;
    return this.bots[0];
  }
}

// 导出单例（与 server/index 共用，避免再启一套 Bot）
let instance = null;

function getBotManager() {
  if (!instance) {
    instance = new MultiBotManager();
  }
  return instance;
}

function getBotInstance() {
  return getBotManager().getBotInstance();
}

module.exports = { MultiBotManager, getBotManager, getBotInstance };
