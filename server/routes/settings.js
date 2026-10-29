const express = require('express');
const Settings = require('../models/Settings');
const { auth, adminAuth } = require('../middleware/auth');
const { redactSettings, mergeSettingSecrets } = require('../utils/secrets');
const { fingerprintTelegramBots, getPrimaryTelegramBot } = require('../utils/telegramBots');
const { getBotManager } = require('../bot/MultiBotManager');

const router = express.Router();

const redactSwapWallets = (settings) => {
  const obj = settings.toObject ? settings.toObject() : { ...settings };
  try {
    const wallets = JSON.parse(obj.swapWallets || '[]');
    obj.swapWallets = JSON.stringify(
      wallets.map(({ privateKeyEncrypted, ...rest }) => ({
        ...rest,
        hasPrivateKey: !!privateKeyEncrypted
      }))
    );
  } catch (_) {}
  return obj;
};

const mergeSwapWalletSecrets = (existing, incoming) => {
  if (!incoming.swapWallets) return incoming;
  try {
    const oldWallets = JSON.parse(existing.swapWallets || '[]');
    const newWallets = typeof incoming.swapWallets === 'string'
      ? JSON.parse(incoming.swapWallets)
      : incoming.swapWallets;
    const byId = Object.fromEntries(oldWallets.map((w) => [String(w.id), w]));
    incoming.swapWallets = JSON.stringify(
      newWallets.map((w) => {
        const { hasPrivateKey, ...rest } = w;
        return {
          ...rest,
          privateKeyEncrypted: rest.privateKeyEncrypted || byId[String(w.id)]?.privateKeyEncrypted
        };
      })
    );
  } catch (_) {}
  return incoming;
};

// 获取公开设置（不需要认证）
router.get('/public', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    // 只返回公开信息
    res.json({
      siteName: settings.siteName,
      siteLogo: settings.siteLogo,
      siteFavicon: settings.siteFavicon, // 添加 Favicon
      siteDescription: settings.siteDescription,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      seoImage: settings.seoImage,
      socialTwitter: settings.socialTwitter,
      socialFacebook: settings.socialFacebook,
      socialTelegram: settings.socialTelegram,
      socialWeChat: settings.socialWeChat,
      socialEmail: settings.socialEmail,
      telegramCustomerService: settings.telegramCustomerService, // TG客服地址
      telegramBotUsername: (getPrimaryTelegramBot(settings) || {}).username || '',
      energyRentalAddress: settings.energyRentalAddress, // 能量租赁收款地址
      energyPriceTrx: settings.energyPriceTrx, // 能量价格 - TRX数量
      energyPriceEnergy: settings.energyPriceEnergy, // 能量价格 - 能量数量
      energyMinAmount: settings.energyMinAmount, // 最小金额
      energyValidityHours: settings.energyValidityHours, // 能量有效期
      energyNotice: settings.energyNotice, // 重要提示
      swapNotice: settings.swapNotice, // 闪兑重要提示
      systemStartTime: settings.systemStartTime, // 系统运行起始时间
      homeHeroImage: settings.homeHeroImage, // 主页右侧展示图片
      footerCompanyName: settings.footerCompanyName,
      footerDescription: settings.footerDescription,
      footerCopyright: settings.footerCopyright,
      footerLinks: settings.footerLinks,
      footerBottomLinks: settings.footerBottomLinks,
      feeType: settings.feeType,
      feeUSDT: settings.feeUSDT,
      feeTRX: settings.feeTRX,
      feePercentage: settings.feePercentage,
      tieredFeeEnabledUSDT: settings.tieredFeeEnabledUSDT, // USDT 阶梯费率开关
      tieredFeeRulesUSDT: settings.tieredFeeRulesUSDT, // USDT 阶梯费率规则
      tieredFeeEnabledTRX: settings.tieredFeeEnabledTRX, // TRX 阶梯费率开关
      tieredFeeRulesTRX: settings.tieredFeeRulesTRX, // TRX 阶梯费率规则
      // 保留旧字段以兼容
      tieredFeeEnabled: settings.tieredFeeEnabled,
      tieredFeeRules: settings.tieredFeeRules,
      exchangeRateMode: settings.exchangeRateMode,
      exchangeRateUSDT: settings.exchangeRateUSDT,
      exchangeRateTRX: settings.exchangeRateTRX,
      exchangeRateMarkup: settings.exchangeRateMarkup,
      paymentAlipayEnabled: settings.paymentAlipayEnabled,
      paymentWechatEnabled: settings.paymentWechatEnabled,
      workspaceAlertEnabled: settings.workspaceAlertEnabled, // 工作台警告弹窗开关
      workspaceAlertTitle: settings.workspaceAlertTitle, // 工作台警告弹窗标题
      workspaceAlertContent: settings.workspaceAlertContent, // 工作台警告弹窗内容
      rewardEnabled: settings.rewardEnabled !== false,
      checkinEnabled: settings.checkinEnabled !== false,
      checkinTrx: settings.checkinTrx,
      inviteSignupTrx: settings.inviteSignupTrx,
      consumeRewardUsdtPercent: settings.consumeRewardUsdtPercent,
      withdrawMinUsdt: settings.withdrawMinUsdt,
      withdrawFeeUsdt: settings.withdrawFeeUsdt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取所有设置（管理员）
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(redactSettings(redactSwapWallets(settings)));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新设置（管理员）
router.put('/', auth, adminAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    const prevTelegramFp = fingerprintTelegramBots(settings.telegramBots);
    Object.assign(settings, mergeSwapWalletSecrets(settings, mergeSettingSecrets(settings, { ...req.body })));
    settings.updatedAt = Date.now();
    await settings.save();

    if (
      Object.prototype.hasOwnProperty.call(req.body, 'telegramBots') &&
      fingerprintTelegramBots(settings.telegramBots) !== prevTelegramFp
    ) {
      getBotManager().reloadFromDb().catch((err) => console.error('❌ 按新配置重启 Bot 失败:', err));
    }

    res.json(redactSettings(redactSwapWallets(settings)));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 手动刷新汇率（管理员）
router.post('/refresh-rates', auth, adminAuth, async (req, res) => {
  try {
    await exchangeRateService.forceUpdate();
    const cacheInfo = exchangeRateService.getCacheInfo();
    res.json({
      success: true,
      message: '汇率已更新',
      rates: cacheInfo.finalRates || { USDT: 0, TRX: 0 },
      lastUpdate: cacheInfo.lastUpdate
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 获取汇率缓存信息（管理员）
router.get('/rate-info', auth, adminAuth, async (req, res) => {
  try {
    const cacheInfo = exchangeRateService.getCacheInfo();
    res.json(cacheInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
