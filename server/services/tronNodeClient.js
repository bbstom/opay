const TronWeb = require('tronweb');
const Settings = require('../models/Settings');

/**
 * TRON 节点连接层：选节点、重试、探测连通性。
 * 转账/能量等业务不放这里。
 */
class TronNodeClient {
  constructor() {
    this.tronWeb = null;
    this.initialized = false;
    this.apiKey = null;
    this.currentApiUrl = null;
    this.apiNodes = [];
    this.currentNodeIndex = 0;
    this.backupNodes = [];
  }

  async retryApiCall(apiCall, maxRetries = 3, timeout = 30000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API 请求超时')), timeout)
        );
        return await Promise.race([apiCall(), timeoutPromise]);
      } catch (error) {
        console.error(`❌ API 调用失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
        if (attempt === maxRetries) throw error;
        const waitTime = 1000 * attempt;
        console.log(`⏳ ${waitTime / 1000} 秒后重试...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * 初始化 TronWeb（仅用于 API 节点连接和地址验证）
   * 注意：多钱包系统不依赖此方法进行转账，每个钱包创建独立的 TronWeb 实例
   */
  async initialize() {
    if (this.initialized && this.tronWeb) return;

    const settings = await Settings.findOne();
    if (!settings) {
      throw new Error('系统配置未完成');
    }

    try {
      this.apiNodes = [];
      if (settings.tronApiNodes) {
        try {
          const nodes = JSON.parse(settings.tronApiNodes);
          this.apiNodes = nodes.filter((node) => node.enabled && node.url).map((node) => ({
            url: node.url,
            apiKey: node.apiKey || null,
            name: node.name
          }));
        } catch (e) {
          console.error('解析 API 节点配置失败:', e);
        }
      }

      if (this.apiNodes.length === 0) {
        this.apiNodes.push({
          url: 'https://api.trongrid.io',
          apiKey: null,
          name: 'Default'
        });
      }

      console.log(`🔗 已加载 ${this.apiNodes.length} 个 API 节点`);
      this.apiNodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node.name}: ${node.url}${node.apiKey ? ' (有 API Key)' : ''}`);
      });

      const connected = await this.connectToNodeWithoutPrivateKey(0);

      if (connected) {
        this.initialized = true;
        console.log('✅ TronWeb 初始化成功（API 节点模式）');
        console.log(`📍 当前节点: ${this.currentApiUrl}`);
      } else {
        throw new Error('所有 API 节点均不可用');
      }
    } catch (error) {
      console.error('❌ TronWeb 初始化失败:', error.message);
      throw new Error('TRON API 初始化失败：' + error.message);
    }
  }

  /**
   * 连接到指定节点（不需要私钥）
   * 用于 API 查询和地址验证
   */
  async connectToNodeWithoutPrivateKey(nodeIndex) {
    if (nodeIndex >= this.apiNodes.length) {
      console.log('❌ 所有配置的节点都已尝试失败');
      return false;
    }

    const node = this.apiNodes[nodeIndex];
    console.log(`🔗 尝试连接节点 ${nodeIndex + 1}/${this.apiNodes.length}: ${node.name} (${node.url})`);

    try {
      const tronWebConfig = {
        fullHost: node.url
      };

      if (node.apiKey) {
        tronWebConfig.headers = {
          'TRON-PRO-API-KEY': node.apiKey
        };
        console.log(`✅ 使用 API Key: ${node.apiKey.slice(0, 10)}...`);
      }

      this.tronWeb = new TronWeb.TronWeb(tronWebConfig);
      this.apiKey = node.apiKey;
      this.currentApiUrl = node.url;
      this.currentNodeIndex = nodeIndex;

      await this.retryApiCall(async () => {
        await this.tronWeb.trx.getBalance('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
      }, 2, 5000);

      console.log(`✅ 节点连接成功: ${node.name}`);
      return true;
    } catch (error) {
      console.error(`❌ 节点连接失败 (${node.name}):`, error.message);
      return await this.connectToNodeWithoutPrivateKey(nodeIndex + 1);
    }
  }

  /**
   * @deprecated 此方法已弃用，多钱包系统不再使用
   * 连接到指定节点（带私钥）
   * 保留用于向后兼容
   */
  async connectToNode(nodeIndex, privateKey) {
    console.warn('⚠️  connectToNode() 方法已弃用，建议使用 connectToNodeWithoutPrivateKey()');

    if (nodeIndex >= this.apiNodes.length) {
      console.log('❌ 所有配置的节点都已尝试失败');
      throw new Error('所有配置的 API 节点均不可用，请检查节点配置');
    }

    const node = this.apiNodes[nodeIndex];
    console.log(`🔗 尝试连接节点 ${nodeIndex + 1}/${this.apiNodes.length}: ${node.name} (${node.url})`);

    try {
      const tronWebConfig = {
        fullHost: node.url,
        privateKey: privateKey
      };

      if (node.apiKey) {
        tronWebConfig.headers = {
          'TRON-PRO-API-KEY': node.apiKey
        };
        console.log(`✅ 使用 API Key: ${node.apiKey.slice(0, 10)}...`);
      }

      this.tronWeb = new TronWeb.TronWeb(tronWebConfig);
      this.apiKey = node.apiKey;
      this.currentApiUrl = node.url;
      this.currentNodeIndex = nodeIndex;

      await this.retryApiCall(async () => {
        const address = this.tronWeb.defaultAddress.base58;
        await this.tronWeb.trx.getBalance(address);
      }, 2, 5000);

      console.log(`✅ 节点连接成功: ${node.name}`);
      return true;
    } catch (error) {
      console.error(`❌ 节点连接失败 (${node.name}):`, error.message);
      return await this.connectToNode(nodeIndex + 1, privateKey);
    }
  }

  isValidAddress(address) {
    try {
      return this.tronWeb && this.tronWeb.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * @deprecated 此方法已弃用，多钱包系统不再使用全局钱包地址
   * 获取钱包地址 - 返回全局 TronWeb 实例的地址
   * 保留用于向后兼容
   */
  getWalletAddress() {
    console.warn('⚠️  getWalletAddress() 方法已弃用，多钱包系统使用 Wallet 模型管理地址');

    if (!this.tronWeb) {
      throw new Error('TronWeb未初始化');
    }
    return this.tronWeb.defaultAddress.base58;
  }

  getCurrentNodeInfo() {
    if (!this.tronWeb) {
      return {
        url: null,
        connected: false,
        isBackupNode: false,
        nodeName: null
      };
    }

    let nodeName = 'Unknown';
    let isBackupNode = false;

    if (this.apiNodes && this.apiNodes.length > 0 && this.currentNodeIndex < this.apiNodes.length) {
      nodeName = this.apiNodes[this.currentNodeIndex].name;
      isBackupNode = false;
    } else if (this.backupNodes.includes(this.currentApiUrl)) {
      nodeName = 'Backup';
      isBackupNode = true;
    }

    return {
      url: this.currentApiUrl,
      connected: this.initialized,
      isBackupNode: isBackupNode,
      nodeName: nodeName
    };
  }
}

module.exports = TronNodeClient;
