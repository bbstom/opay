const TelegramCommand = require('../models/TelegramCommand');
const { getMainKeyboard } = require('./keyboards/main');

// 命令处理器映射
const commandHandlers = {
  // 内置命令处理器
  start: require('./handlers/start').start,
  menu: require('./handlers/start').menu,
  help: require('./handlers/start').help,
  cancel: require('./handlers/start').cancel,
  
  // 功能命令处理器
  pay_usdt: async (ctx) => {
    const paymentHandler = require('./handlers/payment');
    // 模拟 callback 来触发 USDT 代付
    ctx.callbackQuery = { data: 'payment_usdt' };
    await paymentHandler.handleCallback(ctx);
  },
  
  pay_trx: async (ctx) => {
    const paymentHandler = require('./handlers/payment');
    // 模拟 callback 来触发 TRX 代付
    ctx.callbackQuery = { data: 'payment_trx' };
    await paymentHandler.handleCallback(ctx);
  },
  
  my_orders: async (ctx) => {
    const ordersHandler = require('./handlers/orders');
    // 模拟 callback 来显示订单列表
    ctx.callbackQuery = { data: 'orders_list' };
    await ordersHandler.handleCallback(ctx);
  },
  
  energy: async (ctx) => {
    const energyHandler = require('./handlers/energy');
    await energyHandler.start(ctx);
  },
  
  swap: async (ctx) => {
    const swapHandler = require('./handlers/swap');
    await swapHandler.start(ctx);
  },
  
  tickets: async (ctx) => {
    const ticketsHandler = require('./handlers/tickets');
    // 模拟 callback 来显示工单列表
    ctx.callbackQuery = { data: 'tickets_list' };
    await ticketsHandler.handleCallback(ctx);
  },
  
  account: async (ctx) => {
    const startHandler = require('./handlers/start');
    await startHandler.accountInfo(ctx);
  }
};

commandHandlers.orders = commandHandlers.my_orders;

// 注册自定义命令
async function registerCustomCommands(bot) {
  try {
    const commands = await TelegramCommand.find({ enabled: true, showInMenu: true })
      .sort({ order: 1 })
      .lean();

    if (commands.length === 0) {
      console.log('⚠️  没有找到自定义命令，使用默认命令');
      await setDefaultCommands(bot);
      return;
    }

    // 构建命令列表
    const botCommands = commands.map(cmd => ({
      command: cmd.command,
      description: cmd.description
    }));

    // 设置 Bot 命令
    await bot.telegram.setMyCommands(botCommands);
    console.log('✅ 已设置 Bot 快捷指令:', botCommands.length, '个');
    
    // 打印命令列表
    botCommands.forEach(cmd => {
      console.log(`   /${cmd.command} - ${cmd.description}`);
    });

  } catch (error) {
    console.error('❌ 注册自定义命令失败:', error);
    await setDefaultCommands(bot);
  }
}

// 设置默认命令
async function setDefaultCommands(bot) {
  const defaultCommands = [
    { command: 'start', description: '启动机器人' },
    { command: 'menu', description: '显示主菜单' },
    { command: 'pay', description: '代付服务' },
    { command: 'energy', description: '能量租赁' },
    { command: 'swap', description: '闪兑服务' },
    { command: 'orders', description: '我的订单' },
    { command: 'tickets', description: '我的工单' },
    { command: 'account', description: '个人中心' },
    { command: 'help', description: '帮助信息' }
  ];

  try {
    await bot.telegram.setMyCommands(defaultCommands);
    console.log('✅ 已设置默认 Bot 命令');
  } catch (error) {
    console.error('❌ 设置默认命令失败:', error);
  }
}

// 处理命令
async function handleCommand(ctx, commandName) {
  try {
    // 移除开头的 /
    const cmd = commandName.replace(/^\//, '');
    
    console.log('📝 处理命令:', cmd);

    // 检查是否是内置命令
    if (commandHandlers[cmd]) {
      await commandHandlers[cmd](ctx);
      return true;
    }

    // 查找自定义命令
    const customCommand = await TelegramCommand.findOne({ 
      command: cmd, 
      enabled: true 
    });

    if (!customCommand) {
      console.log('⚠️  未找到命令:', cmd);
      return false;
    }

    // 根据 action 类型执行不同操作
    switch (customCommand.action) {
      case 'callback':
        // 模拟 callback 查询
        if (customCommand.callbackData) {
          ctx.callbackQuery = {
            data: customCommand.callbackData,
            from: ctx.from,
            message: ctx.message
          };
          // 触发 callback 处理
          await ctx.telegram.emit('callback_query', ctx);
        }
        break;

      case 'text':
        // 发送文本响应
        if (customCommand.responseText) {
          await ctx.reply(customCommand.responseText, {
            parse_mode: 'HTML',
            ...(await getMainKeyboard())
          });
        }
        break;

      case 'function':
        // 调用指定函数
        if (customCommand.functionName && commandHandlers[customCommand.functionName]) {
          await commandHandlers[customCommand.functionName](ctx);
        } else {
          console.error('❌ 函数不存在:', customCommand.functionName);
          await ctx.reply('❌ 命令配置错误，请联系管理员');
        }
        break;

      default:
        await ctx.reply('❌ 未知的命令类型');
    }

    return true;
  } catch (error) {
    console.error('❌ 处理命令错误:', error);
    await ctx.reply('❌ 命令执行失败，请稍后重试');
    return false;
  }
}

// 初始化默认命令（首次运行时）
async function initializeDefaultCommands() {
  try {
    const count = await TelegramCommand.countDocuments();
    
    if (count > 0) {
      console.log('✅ 已存在自定义命令，跳过初始化');
      return;
    }

    const defaultCommands = [
      {
        command: 'start',
        description: '启动机器人',
        action: 'function',
        functionName: 'start',
        order: 1,
        icon: '🚀'
      },
      {
        command: 'menu',
        description: '显示主菜单',
        action: 'function',
        functionName: 'menu',
        order: 2,
        icon: '📋'
      },
      {
        command: 'pay',
        description: '代付服务',
        action: 'function',
        functionName: 'pay_usdt',
        order: 3,
        icon: '💰'
      },
      {
        command: 'energy',
        description: '能量租赁',
        action: 'function',
        functionName: 'energy',
        order: 4,
        icon: '⚡'
      },
      {
        command: 'swap',
        description: '闪兑服务',
        action: 'function',
        functionName: 'swap',
        order: 5,
        icon: '🔄'
      },
      {
        command: 'orders',
        description: '我的订单',
        action: 'function',
        functionName: 'my_orders',
        order: 6,
        icon: '📦'
      },
      {
        command: 'tickets',
        description: '我的工单',
        action: 'function',
        functionName: 'tickets',
        order: 7,
        icon: '🎫'
      },
      {
        command: 'account',
        description: '个人中心',
        action: 'function',
        functionName: 'account',
        order: 8,
        icon: '👤'
      },
      {
        command: 'help',
        description: '帮助信息',
        action: 'function',
        functionName: 'help',
        order: 9,
        icon: '❓'
      }
    ];

    await TelegramCommand.insertMany(defaultCommands);
    console.log('✅ 已初始化默认命令:', defaultCommands.length, '个');
  } catch (error) {
    console.error('❌ 初始化默认命令失败:', error);
  }
}

module.exports = {
  registerCustomCommands,
  handleCommand,
  initializeDefaultCommands,
  commandHandlers
};
