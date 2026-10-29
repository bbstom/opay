const Wallet = require('../models/Wallet');
const { encryptPrivateKey, getMasterKey } = require('../utils/encryption');
const TronWebModule = require('tronweb');
const TronWeb = TronWebModule.TronWeb;
const tronService = require('./tronService');

class WalletService {
  constructor() {
    this.masterKey = getMasterKey();
  }

  /**
   * 创建钱包
   */
  async createWallet(data) {
    try {
      const { name, privateKey, priority = 50, alerts } = data;

      // 验证私钥
      const validation = await this.validatePrivateKey(privateKey);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // 检查地址是否已存在
      const existing = await Wallet.findOne({ address: validation.address });
      if (existing) {
        throw new Error('该钱包地址已存在');
      }

      // 加密私钥
      const privateKeyEncrypted = encryptPrivateKey(privateKey, this.masterKey);

      // 创建钱包
      const wallet = await Wallet.create({
        name,
        address: validation.address,
        privateKeyEncrypted,
        priority,
        alerts: alerts || {},
        enabled: true
      });

      console.log(`✅ 钱包创建成功: ${name} (${wallet.address})`);

      // 立即刷新余额和资源
      await this.refreshWalletStatus(wallet._id);

      return wallet;
    } catch (error) {
      console.error('❌ 创建钱包失败:', error);
      throw error;
    }
  }

  /**
   * 更新钱包
   */
  async updateWallet(id, data) {
    try {
      const wallet = await Wallet.findById(id);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      // 允许更新的字段
      const allowedFields = ['name', 'priority', 'alerts', 'enabled'];
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          wallet[field] = data[field];
        }
      });

      // 如果提供了新私钥，更新私钥和地址
      if (data.privateKey) {
        const validation = await this.validatePrivateKey(data.privateKey);
        if (!validation.valid) {
          throw new Error(validation.message);
        }

        wallet.privateKeyEncrypted = encryptPrivateKey(data.privateKey, this.masterKey);
        wallet.address = validation.address;
      }

      await wallet.save();
      console.log(`✅ 钱包更新成功: ${wallet.name}`);

      return wallet;
    } catch (error) {
      console.error('❌ 更新钱包失败:', error);
      throw error;
    }
  }

  /**
   * 删除钱包
   */
  async deleteWallet(id) {
    try {
      const wallet = await Wallet.findById(id);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      // 检查是否是最后一个启用的钱包
      const enabledCount = await Wallet.countDocuments({ enabled: true });
      if (wallet.enabled && enabledCount <= 1) {
        throw new Error('不能删除最后一个启用的钱包');
      }

      await Wallet.findByIdAndDelete(id);
      console.log(`✅ 钱包删除成功: ${wallet.name}`);

      return { success: true, message: '钱包已删除' };
    } catch (error) {
      console.error('❌ 删除钱包失败:', error);
      throw error;
    }
  }

  /**
   * 获取钱包详情
   */
  async getWallet(id) {
    try {
      const wallet = await Wallet.findById(id);
      if (!wallet) {
        throw new Error('钱包不存在');
      }
      return wallet;
    } catch (error) {
      console.error('❌ 获取钱包失败:', error);
      throw error;
    }
  }

  /**
   * 获取钱包列表
   */
  async listWallets(filter = {}) {
    try {
      const query = {};

      if (filter.enabled !== undefined) {
        query.enabled = filter.enabled;
      }

      if (filter.status) {
        query['health.status'] = filter.status;
      }

      const wallets = await Wallet.find(query).sort({ priority: -1, createdAt: -1 });
      return wallets;
    } catch (error) {
      console.error('❌ 获取钱包列表失败:', error);
      throw error;
    }
  }

  /**
   * 启用钱包
   */
  async enableWallet(id) {
    try {
      const wallet = await Wallet.findById(id);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      wallet.enabled = true;
      wallet.health.status = 'healthy';
      await wallet.save();

      console.log(`✅ 钱包已启用: ${wallet.name}`);
      return wallet;
    } catch (error) {
      console.error('❌ 启用钱包失败:', error);
      throw error;
    }
  }

  /**
   * 禁用钱包
   */
  async disableWallet(id) {
    try {
      const wallet = await Wallet.findById(id);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      // 检查是否是最后一个启用的钱包
      const enabledCount = await Wallet.countDocuments({ enabled: true });
      if (wallet.enabled && enabledCount <= 1) {
        throw new Error('不能禁用最后一个启用的钱包');
      }

      wallet.enabled = false;
      wallet.health.status = 'disabled';
      await wallet.save();

      console.log(`✅ 钱包已禁用: ${wallet.name}`);
      return wallet;
    } catch (error) {
      console.error('❌ 禁用钱包失败:', error);
      throw error;
    }
  }

  /**
   * 验证私钥
   */
  async validatePrivateKey(privateKey) {
    try {
      // 检查格式
      if (!privateKey || typeof privateKey !== 'string') {
        return { valid: false, message: '私钥不能为空' };
      }

      // 移除可能的前缀和空格
      privateKey = privateKey.trim().replace(/^0x/i, '');

      // 检查长度
      if (privateKey.length !== 64) {
        return { valid: false, message: '私钥必须是64位十六进制字符' };
      }

      // 检查是否为有效的十六进制
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        return { valid: false, message: '私钥必须是有效的十六进制字符' };
      }

      // 使用 TronWeb 验证
      try {
        const tronWeb = new TronWeb({
          fullHost: 'https://api.trongrid.io',
          privateKey: privateKey
        });

        const address = tronWeb.address.fromPrivateKey(privateKey);

        return {
          valid: true,
          address: address,
          message: '私钥验证成功'
        };
      } catch (error) {
        return {
          valid: false,
          message: '私钥无效: ' + error.message
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: '验证失败: ' + error.message
      };
    }
  }

  /**
   * 刷新钱包状态（余额和资源）
   */
  async refreshWalletStatus(id) {
    try {
      const wallet = await Wallet.findById(id);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      // 查余额不需要私钥
      await tronService.initialize();
      const trx = await tronService.getBalance(wallet.address);
      const usdt = await tronService.getUSDTBalance(wallet.address);
      const resources = await tronService.tronWeb.trx.getAccountResources(wallet.address);

      const energyLimit = resources.EnergyLimit || 0;
      const energyUsed = resources.EnergyUsed || 0;
      const energyAvailable = energyLimit - energyUsed;

      const freeNetLimit = resources.freeNetLimit || 0;
      const freeNetUsed = resources.freeNetUsed || 0;
      const netLimit = resources.NetLimit || 0;
      const netUsed = resources.NetUsed || 0;
      const bandwidthAvailable = (freeNetLimit - freeNetUsed) + (netLimit - netUsed);

      // 更新钱包
      await wallet.updateBalance(trx, usdt);
      await wallet.updateResources(
        {
          available: energyAvailable,
          limit: energyLimit,
          used: energyUsed
        },
        {
          available: bandwidthAvailable,
          limit: freeNetLimit + netLimit,
          used: freeNetUsed + netUsed
        }
      );

      // 更新健康状态
      await wallet.updateHealth('healthy');

      console.log(`✅ 钱包状态已刷新: ${wallet.name} (TRX: ${trx}, USDT: ${usdt})`);

      return wallet;
    } catch (error) {
      console.error(`❌ 刷新钱包状态失败 (${id}):`, error.message);
      
      // 更新为错误状态
      const wallet = await Wallet.findById(id);
      if (wallet) {
        await wallet.updateHealth('error', error.message);
      }
      
      throw error;
    }
  }

  /**
   * 刷新所有钱包状态
   */
  async refreshAllWallets() {
    try {
      const wallets = await Wallet.find({ enabled: true });
      console.log(`🔄 开始刷新 ${wallets.length} 个钱包...`);

      const results = [];
      for (const wallet of wallets) {
        try {
          await this.refreshWalletStatus(wallet._id);
          results.push({ id: wallet._id, success: true });
        } catch (error) {
          results.push({ id: wallet._id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ 刷新完成: ${successCount}/${wallets.length} 成功`);

      return {
        success: successCount,
        total: wallets.length,
        results: results
      };
    } catch (error) {
      console.error('❌ 刷新所有钱包失败:', error);
      throw error;
    }
  }

  /**
   * 检查钱包健康状态
   */
  async checkWalletHealth(id) {
    try {
      await this.refreshWalletStatus(id);
      const wallet = await Wallet.findById(id);
      
      // 检查预警条件
      if (wallet.needsAlert) {
        wallet.health.status = 'warning';
        await wallet.save();
      }

      return {
        id: wallet._id,
        name: wallet.name,
        status: wallet.health.status,
        needsAlert: wallet.needsAlert,
        balance: wallet.balance,
        resources: wallet.resources
      };
    } catch (error) {
      console.error(`❌ 健康检查失败 (${id}):`, error);
      throw error;
    }
  }

  /**
   * 获取钱包统计
   */
  async getWalletStats(id) {
    try {
      const wallet = await Wallet.findById(id);
      if (!wallet) {
        throw new Error('钱包不存在');
      }

      return {
        name: wallet.name,
        address: wallet.address,
        stats: wallet.stats,
        successRate: wallet.successRate,
        balance: wallet.balance,
        resources: wallet.resources,
        health: wallet.health
      };
    } catch (error) {
      console.error('❌ 获取统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有钱包的汇总统计
   */
  async getAllWalletsStats() {
    try {
      const wallets = await Wallet.find();
      
      const stats = {
        total: wallets.length,
        enabled: wallets.filter(w => w.enabled).length,
        disabled: wallets.filter(w => !w.enabled).length,
        healthy: wallets.filter(w => w.health.status === 'healthy').length,
        warning: wallets.filter(w => w.health.status === 'warning').length,
        error: wallets.filter(w => w.health.status === 'error').length,
        totalBalance: {
          trx: wallets.reduce((sum, w) => sum + w.balance.trx, 0),
          usdt: wallets.reduce((sum, w) => sum + w.balance.usdt, 0)
        },
        totalTransactions: wallets.reduce((sum, w) => sum + w.stats.totalTransactions, 0),
        totalSuccess: wallets.reduce((sum, w) => sum + w.stats.successCount, 0),
        totalFail: wallets.reduce((sum, w) => sum + w.stats.failCount, 0)
      };

      return stats;
    } catch (error) {
      console.error('❌ 获取汇总统计失败:', error);
      throw error;
    }
  }
}

module.exports = new WalletService();
