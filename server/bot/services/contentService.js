const TelegramContent = require('../../models/TelegramContent');
const { Markup } = require('telegraf');

class ContentService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 1分钟缓存
    this.settingsCache = null;
    this.settingsCacheTime = 0;
  }

  async pickBaseVars(ctx) {
    if (!this.settingsCache || Date.now() - this.settingsCacheTime > this.cacheTTL) {
      const Settings = require('../../models/Settings');
      this.settingsCache = await Settings.findOne().select('siteName telegramCustomerService').lean();
      this.settingsCacheTime = Date.now();
    }
    const settings = this.settingsCache;
    const from = ctx?.from || {};
    const user = ctx?.session?.user || {};
    return {
      siteName: settings?.siteName || '可可代付',
      username: user.username || from.username || '',
      firstName: from.first_name || user.telegramFirstName || user.username || '',
      telegramId: from.id != null ? String(from.id) : String(user.telegramId || ''),
      email: user.email || '',
      websiteUrl: process.env.APP_URL || '',
      customerService: settings?.telegramCustomerService || ''
    };
  }

  // 获取内容配置
  async getContent(key) {
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.time) < this.cacheTTL) {
      return cached.data;
    }

    // 从数据库获取
    const content = await TelegramContent.findOne({ key, enabled: true });
    
    if (content) {
      this.cache.set(key, { data: content, time: Date.now() });
    }

    return content;
  }

  fillVars(text, variables = {}) {
    let out = String(text || '');
    Object.keys(variables).forEach((key) => {
      const value = variables[key] == null ? '' : String(variables[key]);
      out = out.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return out;
  }

  async mergeVars(ctx, variables = {}) {
    let base = {};
    try {
      base = await this.pickBaseVars(ctx);
    } catch (error) {
      console.error('读取通用变量失败:', error);
    }
    return { ...base, ...variables };
  }

  async renderKey(ctx, key, variables = {}) {
    const content = await this.getContent(key);
    if (!content) return null;
    return this.renderContent(content, await this.mergeVars(ctx, variables));
  }

  // 渲染内容（替换变量）
  renderContent(content, variables = {}) {
    if (!content || !content.content) return null;

    const text = this.fillVars(content.content.text || '', variables);
    const caption = this.fillVars(content.content.caption || '', variables);

    return {
      type: content.content.type,
      text,
      mediaUrl: content.content.mediaUrl,
      caption,
      parseMode: content.content.parseMode,
      features: content.features,
      buttons: this.buildButtons(content, variables)
    };
  }

  // 构建按钮
  buildButtons(content, variables = {}) {
    if (!content.buttons || content.buttons.length === 0) {
      console.log(`🔍 [contentService] 没有自定义按钮`);
      return null;
    }

    console.log(`🔍 [contentService] 构建自定义按钮，数量: ${content.buttons.length}`);
    content.buttons.forEach(btn => {
      console.log(`  - 按钮: "${btn.text}", 类型: ${btn.type}, 数据: ${btn.data}`);
    });

    // 按行分组
    const rows = {};
    content.buttons.forEach(btn => {
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
            // 替换按钮文本和数据中的变量
            let text = btn.text;
            let data = btn.data;
            
            text = this.fillVars(text, variables);
            data = this.fillVars(data, variables);

            if (btn.type === 'url') {
              // 验证和修复 URL 格式
              let url = data;
              
              // 如果是 Telegram 用户名格式（@username），转换为 t.me 链接
              if (url.startsWith('@')) {
                url = `https://t.me/${url.substring(1)}`;
              }
              // 如果不是以 http:// 或 https:// 开头，添加 https://
              else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`;
              }
              
              return Markup.button.url(text, url);
            } else if (btn.type === 'copy') {
              // Telegram不直接支持复制，使用callback模拟
              return Markup.button.callback(text, `copy_${data}`);
            } else {
              return Markup.button.callback(text, data);
            }
          });
      });

    return Markup.inlineKeyboard(buttons);
  }

  // 发送内容
  async sendContent(ctx, key, variables = {}, defaultKeyboard = null) {
    try {
      const content = await this.getContent(key);
      
      if (!content) {
        console.warn(`内容不存在: ${key}`);
        return false;
      }

      const rendered = this.renderContent(content, await this.mergeVars(ctx, variables));
      
      if (!rendered) {
        return false;
      }

      console.log(`🔍 [contentService] 渲染内容: ${key}, 类型: ${rendered.type}, 有媒体: ${!!rendered.mediaUrl}`);

      const options = {
        parse_mode: rendered.parseMode
      };

      // 如果有自定义按钮，使用自定义按钮；否则使用默认键盘
      if (rendered.buttons) {
        options.reply_markup = rendered.buttons.reply_markup;
        console.log(`🔍 [contentService] 使用自定义按钮`);
      } else if (defaultKeyboard) {
        options.reply_markup = defaultKeyboard.reply_markup;
        console.log(`🔍 [contentService] 使用默认键盘`);
      }

      // 根据类型发送
      if (rendered.type === 'photo' && rendered.mediaUrl) {
        console.log(`📷 [contentService] 发送图片消息: ${key}`);
        
        // 如果是回调查询（按钮点击），先删除旧消息
        if (ctx.callbackQuery && ctx.update?.callback_query) {
          try {
            await ctx.deleteMessage();
            console.log(`🗑️  [contentService] 已删除旧消息`);
          } catch (error) {
            console.log(`⚠️  [contentService] 删除旧消息失败: ${error.message}`);
          }
        }
        
        await ctx.replyWithPhoto(rendered.mediaUrl, {
          caption: rendered.caption || rendered.text,
          ...options
        });
      } else if (rendered.type === 'video' && rendered.mediaUrl) {
        console.log(`🎥 [contentService] 发送视频消息: ${key}`);
        
        // 如果是回调查询（按钮点击），先删除旧消息
        if (ctx.callbackQuery && ctx.update?.callback_query) {
          try {
            await ctx.deleteMessage();
            console.log(`🗑️  [contentService] 已删除旧消息`);
          } catch (error) {
            console.log(`⚠️  [contentService] 删除旧消息失败: ${error.message}`);
          }
        }
        
        await ctx.replyWithVideo(rendered.mediaUrl, {
          caption: rendered.caption || rendered.text,
          ...options
        });
      } else if (rendered.type === 'document' && rendered.mediaUrl) {
        console.log(`📄 [contentService] 发送文档消息: ${key}`);
        
        // 如果是回调查询（按钮点击），先删除旧消息
        if (ctx.callbackQuery && ctx.update?.callback_query) {
          try {
            await ctx.deleteMessage();
            console.log(`🗑️  [contentService] 已删除旧消息`);
          } catch (error) {
            console.log(`⚠️  [contentService] 删除旧消息失败: ${error.message}`);
          }
        }
        
        await ctx.replyWithDocument(rendered.mediaUrl, {
          caption: rendered.caption || rendered.text,
          ...options
        });
      } else if (rendered.type === 'photo' && !rendered.mediaUrl) {
        await ctx.replyWithPhoto(rendered.mediaUrl, {
          caption: rendered.caption || rendered.text,
          ...options
        });
      } else if (rendered.type === 'video' && rendered.mediaUrl) {
        await ctx.replyWithVideo(rendered.mediaUrl, {
          caption: rendered.caption || rendered.text,
          ...options
        });
      } else if (rendered.type === 'document' && rendered.mediaUrl) {
        await ctx.replyWithDocument(rendered.mediaUrl, {
          caption: rendered.caption || rendered.text,
          ...options
        });
      } else if (rendered.type === 'photo' && !rendered.mediaUrl) {
        // 图片类型但没有媒体URL，当作文本处理
        console.log(`⚠️  [contentService] 图片类型但无媒体URL，当作文本处理: ${key}`);
        if (ctx.callbackQuery && ctx.update?.callback_query) {
          try {
            console.log(`📝 [contentService] 尝试编辑消息: ${key}`);
            await ctx.editMessageText(rendered.text, options);
            console.log(`✅ [contentService] 消息编辑成功: ${key}`);
          } catch (error) {
            console.log(`⚠️  [contentService] 编辑失败: ${error.message}`);
            if (error.message.includes('message to edit') || 
                error.message.includes('message is not modified')) {
              await ctx.reply(rendered.text, options);
              console.log(`✅ [contentService] 已发送新消息: ${key}`);
            } else {
              throw error;
            }
          }
        } else {
          console.log(`📤 [contentService] 发送新消息: ${key}`);
          await ctx.reply(rendered.text, options);
        }
      } else {
        // 文本消息：尝试编辑，失败则发送新消息
        console.log(`📝 [contentService] 文本消息处理: ${key}`);
        if (ctx.callbackQuery && ctx.update?.callback_query) {
          try {
            console.log(`📝 [contentService] 尝试编辑消息: ${key}`);
            await ctx.editMessageText(rendered.text, options);
            console.log(`✅ [contentService] 消息编辑成功: ${key}`);
          } catch (error) {
            console.log(`⚠️  [contentService] 编辑失败: ${error.message}`);
            // 如果编辑失败（比如是图片消息），发送新消息
            if (error.message.includes('message to edit') || 
                error.message.includes('message is not modified')) {
              await ctx.reply(rendered.text, options);
              console.log(`✅ [contentService] 已发送新消息: ${key}`);
            } else {
              throw error;
            }
          }
        } else {
          console.log(`📤 [contentService] 发送新消息: ${key}`);
          await ctx.reply(rendered.text, options);
        }
      }

      return true;
    } catch (error) {
      console.error(`发送内容失败 (${key}):`, error);
      return false;
    }
  }

  // 编辑内容
  async editContent(ctx, key, variables = {}) {
    try {
      const content = await this.getContent(key);
      
      if (!content) {
        return false;
      }

      const rendered = this.renderContent(content, await this.mergeVars(ctx, variables));
      
      if (!rendered || rendered.type !== 'text') {
        return false;
      }

      const options = {
        parse_mode: rendered.parseMode
      };

      if (rendered.buttons) {
        options.reply_markup = rendered.buttons.reply_markup;
      }

      await ctx.editMessageText(rendered.text, options);
      return true;
    } catch (error) {
      console.error(`编辑内容失败 (${key}):`, error);
      return false;
    }
  }

  // 清除缓存
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // 处理复制按钮
  async handleCopyButton(ctx, data) {
    try {
      // Telegram Bot API不支持直接复制到剪贴板
      // 我们发送一个包含可复制文本的消息
      await ctx.answerCbQuery('请长按下方文本进行复制');
      await ctx.reply(
        `📋 <b>复制内容：</b>\n\n<code>${data}</code>\n\n💡 长按上方文本即可复制`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      console.error('处理复制按钮失败:', error);
      await ctx.answerCbQuery('复制失败');
    }
  }
}

// 导出单例
module.exports = new ContentService();
