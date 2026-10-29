const TelegramBroadcast = require('../models/TelegramBroadcast');
const User = require('../models/User');
const TelegramGroup = require('../models/TelegramGroup');
const { getBotInstance } = require('../bot/MultiBotManager');
const { withJobLock } = require('../utils/jobLock');

class BroadcastScheduler {
  constructor() {
    this.checkInterval = null;
    this.isRunning = false;
    this.intervalMinutes = 5; // 默认 5 分钟
  }

  /**
   * 启动定时检查服务
   * @param {number} intervalMinutes - 检查间隔（分钟），默认 5 分钟
   */
  start(intervalMinutes = 5) {
    if (this.isRunning) {
      console.log('⚠️  群发定时服务已在运行');
      return;
    }

    this.intervalMinutes = intervalMinutes;
    console.log(`🚀 启动群发定时服务（每 ${intervalMinutes} 分钟检查一次）`);
    
    // 立即执行一次检查
    this.checkScheduledBroadcasts().catch(err => {
      console.error('初始检查失败:', err);
    });

    // 设置定时任务
    this.checkInterval = setInterval(() => {
      this.checkScheduledBroadcasts().catch(err => {
        console.error('定时检查失败:', err);
      });
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  /**
   * 停止定时检查服务
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.isRunning = false;
      console.log('🛑 群发定时服务已停止');
    }
  }

  /**
   * 重启定时服务（用于更新间隔时间）
   * @param {number} intervalMinutes - 新的检查间隔（分钟）
   */
  restart(intervalMinutes) {
    console.log(`🔄 重启群发定时服务，新间隔: ${intervalMinutes} 分钟`);
    this.stop();
    this.start(intervalMinutes);
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      intervalSeconds: this.intervalMinutes * 60
    };
  }

  /**
   * 检查并执行待发送的群发任务
   */
  async checkScheduledBroadcasts() {
    return withJobLock('broadcast-scheduler', 4 * 60 * 1000, async () => {
    try {
      const now = new Date();
      
      console.log(`\n🔍 检查待发送的群发任务 (${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })})`);

      // 查找需要发送的任务
      // 1. 定时发送：scheduledAt <= now 且 status = 'draft'
      const draftBroadcasts = await TelegramBroadcast.find({
        status: 'draft',
        scheduledAt: { $lte: now }
      });

      // 2. 重复发送：repeatEnabled = true 且 nextSendAt <= now 且 status = 'completed'
      const repeatBroadcasts = await TelegramBroadcast.find({
        status: 'completed',
        repeatEnabled: true,
        nextSendAt: { $lte: now }
      });

      // 过滤重复发送任务：检查是否达到最大次数
      const validRepeatBroadcasts = repeatBroadcasts.filter(broadcast => {
        // maxRepeatCount = 0 表示无限重复
        if (broadcast.maxRepeatCount === 0) return true;
        // 检查是否未达到最大次数
        return broadcast.repeatCount < broadcast.maxRepeatCount;
      });

      // 合并两类任务
      const broadcasts = [...draftBroadcasts, ...validRepeatBroadcasts];

      if (broadcasts.length === 0) {
        console.log('✅ 没有待发送的任务');
        return;
      }

      console.log(`📨 找到 ${broadcasts.length} 个待发送任务\n`);

      // 逐个执行
      for (const broadcast of broadcasts) {
        try {
          await this.executeBroadcast(broadcast);
        } catch (error) {
          console.error(`❌ 执行群发失败 (${broadcast.title}):`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ 检查群发任务失败:', error);
    }
    });
  }

  /**
   * 执行群发任务
   */
  async executeBroadcast(broadcast) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📤 开始执行群发: ${broadcast.title}`);
    console.log(`   类型: ${broadcast.contentType}`);
    console.log(`   目标: ${broadcast.targetType}`);
    console.log(`   重复: ${broadcast.repeatEnabled ? `是 (${broadcast.repeatCount + 1}/${broadcast.maxRepeatCount || '∞'})` : '否'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // 更新状态为发送中
    broadcast.status = 'sending';
    await broadcast.save();

    const botInstance = getBotInstance();
    if (!botInstance || !botInstance.bot) {
      throw new Error('Bot 实例未初始化');
    }

    const bot = botInstance.bot;
    let sentCount = 0;
    let failedCount = 0;
    const failedDetails = []; // 记录失败详情

    try {
      // 构建消息选项
      const messageOptions = {
        parse_mode: broadcast.parseMode
      };

      // 添加按钮
      if (broadcast.buttons && broadcast.buttons.length > 0) {
        const { Markup } = require('telegraf');
        const rows = {};
        broadcast.buttons.forEach(btn => {
          if (!rows[btn.row]) rows[btn.row] = [];
          rows[btn.row].push(btn);
        });

        const buttons = Object.keys(rows)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(row => {
            return rows[row]
              .sort((a, b) => a.col - b.col)
              .map(btn => {
                if (btn.type === 'url') {
                  // 验证和修复 URL 格式
                  let url = btn.data;
                  
                  // 如果是 Telegram 用户名格式（@username），转换为 t.me 链接
                  if (url.startsWith('@')) {
                    url = `https://t.me/${url.substring(1)}`;
                  }
                  // 如果不是以 http:// 或 https:// 开头，添加 https://
                  else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = `https://${url}`;
                  }
                  
                  return Markup.button.url(btn.text, url);
                } else {
                  return Markup.button.callback(btn.text, btn.data);
                }
              });
          });

        messageOptions.reply_markup = Markup.inlineKeyboard(buttons).reply_markup;
      }

      // 如果是群组群发，特殊处理
      if (broadcast.targetType === 'group' && broadcast.targetGroups && broadcast.targetGroups.length > 0) {
        console.log(`👥 目标群组数: ${broadcast.targetGroups.length}`);
        
        // 发送到群组
        for (const groupChatId of broadcast.targetGroups) {
          try {
            if (broadcast.contentType === 'photo' && broadcast.mediaUrl) {
              await bot.telegram.sendPhoto(groupChatId, broadcast.mediaUrl, {
                caption: broadcast.content,
                ...messageOptions
              });
            } else if (broadcast.contentType === 'video' && broadcast.mediaUrl) {
              await bot.telegram.sendVideo(groupChatId, broadcast.mediaUrl, {
                caption: broadcast.content,
                ...messageOptions
              });
            } else if (broadcast.contentType === 'document' && broadcast.mediaUrl) {
              await bot.telegram.sendDocument(groupChatId, broadcast.mediaUrl, {
                caption: broadcast.content,
                ...messageOptions
              });
            } else {
              await bot.telegram.sendMessage(groupChatId, broadcast.content, messageOptions);
            }

            sentCount++;
            console.log(`✅ 已发送到群组: ${groupChatId}`);

            // 每发送一个群组暂停 1 秒
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            const errorMsg = error.response?.description || error.message;
            console.error(`发送失败 (群组 ${groupChatId}): ${error.response?.error_code || 'ERROR'}: ${errorMsg}`);
            
            // 记录失败详情
            failedDetails.push({
              telegramId: groupChatId,
              username: `群组_${groupChatId}`,
              error: errorMsg,
              errorCode: error.response?.error_code
            });
            
            failedCount++;
          }
        }
        
        // 更新总数
        broadcast.totalUsers = broadcast.targetGroups.length;
        
      } else {
        // 发送给用户
        const targetUsers = await this.getTargetUsers(broadcast);
        console.log(`👥 目标用户数: ${targetUsers.length}`);
        
        if (targetUsers.length === 0) {
          console.warn('⚠️  没有找到目标用户，请检查：');
          console.warn('   1. 是否有用户绑定了 Telegram');
          console.warn('   2. targetType 是否正确');
          console.warn('   3. 如果是自定义列表，是否填写了 targetUsers');
        }
        
        // 更新总数
        broadcast.totalUsers = targetUsers.length;

        // 发送消息给用户
        for (const user of targetUsers) {
          try {
            if (broadcast.contentType === 'photo' && broadcast.mediaUrl) {
              await bot.telegram.sendPhoto(user.telegramId, broadcast.mediaUrl, {
                caption: broadcast.content,
                ...messageOptions
              });
            } else if (broadcast.contentType === 'video' && broadcast.mediaUrl) {
              await bot.telegram.sendVideo(user.telegramId, broadcast.mediaUrl, {
                caption: broadcast.content,
                ...messageOptions
              });
            } else if (broadcast.contentType === 'document' && broadcast.mediaUrl) {
              await bot.telegram.sendDocument(user.telegramId, broadcast.mediaUrl, {
                caption: broadcast.content,
                ...messageOptions
              });
            } else {
              await bot.telegram.sendMessage(user.telegramId, broadcast.content, messageOptions);
            }

            sentCount++;

            // 每发送 10 条消息暂停 1 秒，避免触发限流
            if (sentCount % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

          } catch (error) {
            const errorMsg = error.response?.description || error.message;
            console.error(`发送失败 (TG ${user.telegramId}): ${error.response?.error_code || 'ERROR'}: ${errorMsg}`);
            
            // 记录失败详情
            failedDetails.push({
              telegramId: user.telegramId,
              username: user.telegramUsername || user.username,
              error: errorMsg,
              errorCode: error.response?.error_code
            });
            
            failedCount++;
          }
        }
      }

      console.log(`\n✅ 群发完成`);
      console.log(`   成功: ${sentCount}`);
      console.log(`   失败: ${failedCount}`);
      
      // 如果有失败，显示失败详情摘要
      if (failedDetails.length > 0) {
        console.log(`\n❌ 失败详情:`);
        
        // 统计错误类型
        const errorStats = {};
        failedDetails.forEach(detail => {
          const key = detail.error;
          if (!errorStats[key]) {
            errorStats[key] = { count: 0, examples: [] };
          }
          errorStats[key].count++;
          if (errorStats[key].examples.length < 3) {
            errorStats[key].examples.push(detail.telegramId);
          }
        });
        
        // 显示错误统计
        Object.entries(errorStats).forEach(([error, stat]) => {
          console.log(`   • ${error}: ${stat.count} 次`);
          console.log(`     示例用户: ${stat.examples.join(', ')}`);
        });
      }
      console.log();

      // 更新统计
      const now = new Date();
      broadcast.sentCount = sentCount;
      broadcast.failedCount = failedCount;
      broadcast.lastSentAt = now;

      // 添加到历史记录
      if (!broadcast.repeatHistory) {
        broadcast.repeatHistory = [];
      }
      broadcast.repeatHistory.push({
        sentAt: now,
        sentCount: sentCount,
        failedCount: failedCount,
        failedDetails: failedDetails.slice(0, 10) // 只保留前 10 条失败详情
      });

      // 如果是首次发送
      if (!broadcast.sentAt) {
        broadcast.sentAt = now;
      }

      // 处理重复发送
      if (broadcast.repeatEnabled) {
        broadcast.repeatCount += 1;

        // 检查是否达到最大次数
        if (broadcast.maxRepeatCount > 0 && broadcast.repeatCount >= broadcast.maxRepeatCount) {
          console.log(`🏁 已达到最大重复次数 (${broadcast.maxRepeatCount})`);
          broadcast.status = 'completed';
          broadcast.nextSendAt = null;
        } else {
          // 计算下次发送时间
          const nextSend = new Date(now.getTime() + broadcast.repeatInterval * 60 * 60 * 1000);
          broadcast.nextSendAt = nextSend;
          broadcast.status = 'completed';
          
          console.log(`⏰ 下次发送时间: ${nextSend.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
        }
      } else {
        broadcast.status = 'completed';
      }

      await broadcast.save();

    } catch (error) {
      console.error('❌ 群发执行失败:', error);
      broadcast.status = 'failed';
      broadcast.sentCount = sentCount;
      broadcast.failedCount = failedCount;
      await broadcast.save();
      throw error;
    }
  }

  /**
   * 获取目标用户列表
   */
  async getTargetUsers(broadcast) {
    let users = [];

    console.log(`🔍 查询目标用户，类型: ${broadcast.targetType}`);

    switch (broadcast.targetType) {
      case 'all':
        // 所有用户
        users = await User.find({ telegramId: { $exists: true, $ne: null } });
        console.log(`   找到 ${users.length} 个用户（所有用户）`);
        break;

      case 'active':
        // 活跃用户（最近 30 天有登录）
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        users = await User.find({
          telegramId: { $exists: true, $ne: null },
          lastLoginAt: { $gte: thirtyDaysAgo }
        });
        console.log(`   找到 ${users.length} 个用户（活跃用户）`);
        break;

      case 'inactive':
        // 不活跃用户（超过 30 天未登录）
        const thirtyDaysAgo2 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        users = await User.find({
          telegramId: { $exists: true, $ne: null },
          $or: [
            { lastLoginAt: { $lt: thirtyDaysAgo2 } },
            { lastLoginAt: { $exists: false } }
          ]
        });
        console.log(`   找到 ${users.length} 个用户（不活跃用户）`);
        break;

      case 'custom':
        // 自定义用户列表
        if (broadcast.targetUsers && broadcast.targetUsers.length > 0) {
          users = await User.find({
            telegramId: { $in: broadcast.targetUsers }
          });
          console.log(`   找到 ${users.length} 个用户（自定义列表）`);
        } else {
          console.warn('   ⚠️  自定义用户列表为空');
        }
        break;

      case 'group':
        // 群组群发
        if (broadcast.targetGroups && broadcast.targetGroups.length > 0) {
          console.log(`   目标群组数: ${broadcast.targetGroups.length}`);
          // 群组群发不需要用户列表，直接返回空数组
          // 在发送时会特殊处理
          users = [];
        } else {
          console.warn('   ⚠️  目标群组列表为空');
        }
        break;

      default:
        console.warn(`   ⚠️  未知的目标类型: ${broadcast.targetType}`);
        users = [];
    }

    return users;
  }

  /**
   * 手动触发群发（用于测试或立即发送）
   */
  async triggerBroadcast(broadcastId) {
    const broadcast = await TelegramBroadcast.findById(broadcastId);
    if (!broadcast) {
      throw new Error('群发任务不存在');
    }

    await this.executeBroadcast(broadcast);
  }
}

// 导出单例
module.exports = new BroadcastScheduler();
