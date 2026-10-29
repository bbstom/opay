const TronWeb = require('tronweb');
const axios = require('axios');
const SwapOrder = require('../models/SwapOrder');
const Settings = require('../models/Settings');
const emailService = require('./emailService');
const { withJobLock } = require('../utils/jobLock');

class SwapService {
  constructor() {
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.checkInterval = 15000; // 每15秒检查一次
  }

  // 选择一个可用的闪兑钱包
  async selectSwapWallet() {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('系统设置未找到');
      }

      let swapWallets = [];
      try {
        swapWallets = JSON.parse(settings.swapWallets || '[]');
      } catch (e) {
        console.error('解析闪兑钱包配置失败:', e);
        return null;
      }

      // 筛选启用的钱包
      const enabledWallets = swapWallets.filter(w => w.enabled);

      if (enabledWallets.length === 0) {
        console.error('❌ 没有可用的闪兑钱包');
        return null;
      }

      // 按优先级排序，选择优先级最高的
      enabledWallets.sort((a, b) => (b.priority || 50) - (a.priority || 50));

      // 返回第一个（优先级最高的）
      const selectedWallet = enabledWallets[0];
      
      console.log(`✅ 选择闪兑钱包: ${selectedWallet.name} (${selectedWallet.address})`);
      
      return selectedWallet;

    } catch (error) {
      console.error('选择闪兑钱包失败:', error);
      return null;
    }
  }

  // 根据钱包ID获取钱包配置
  async getSwapWalletById(walletId) {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('系统设置未找到');
      }

      let swapWallets = [];
      try {
        swapWallets = JSON.parse(settings.swapWallets || '[]');
      } catch (e) {
        console.error('解析闪兑钱包配置失败:', e);
        return null;
      }

      const wallet = swapWallets.find(w => w.id === walletId);
      
      if (!wallet) {
        console.error(`❌ 闪兑钱包未找到: ${walletId}`);
        return null;
      }

      return wallet;

    } catch (error) {
      console.error('获取闪兑钱包失败:', error);
      return null;
    }
  }

  // 启动监控服务
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ 闪兑监控服务已在运行');
      return;
    }

    console.log('🔄 启动闪兑监控服务...');
    this.isMonitoring = true;

    // 立即执行一次
    await this.checkPendingOrders();

    // 定时检查
    this.monitorInterval = setInterval(async () => {
      await this.checkPendingOrders();
    }, this.checkInterval);

    console.log('✅ 闪兑监控服务已启动');
  }

  // 停止监控服务
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ 闪兑监控服务已停止');
  }

  // 检查待处理的订单
  async checkPendingOrders() {
    await withJobLock('swap-monitor', 20 * 1000, async () => {
    try {
      // 获取所有等待接收的订单
      const waitingOrders = await SwapOrder.find({
        receiveStatus: 'waiting',
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (waitingOrders.length > 0) {
        console.log(`🔍 检查 ${waitingOrders.length} 个待处理闪兑订单...`);
      }

      for (const order of waitingOrders) {
        await this.checkOrderReceive(order);
      }

      // 检查已接收但未发送的订单
      const receivedOrders = await SwapOrder.find({
        receiveStatus: 'received',
        sendStatus: { $in: ['pending', 'failed'] },
        status: { $in: ['pending', 'processing'] }
      });

      for (const order of receivedOrders) {
        await this.processSendTRX(order);
      }

      // 检查超时订单
      await this.checkTimeoutOrders();

    } catch (error) {
      console.error('❌ 检查闪兑订单失败:', error);
    }
    });
  }

  // 检查订单是否收到USDT
  async checkOrderReceive(order) {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('系统设置未找到');
      }

      // 获取钱包信息
      const wallet = await this.getSwapWalletById(order.systemWalletId);

      if (!wallet) {
        console.error(`❌ 闪兑钱包未找到: ${order.systemWalletId}`);
        return;
      }

      // 初始化 TronWeb
      const tronWeb = await this.initTronWeb(settings, wallet);

      // 获取钱包的USDT交易记录
      const transactions = await this.getUSDTTransactions(
        tronWeb, 
        order.systemWalletAddress,
        order.createdAt
      );

      // 查找匹配的转账
      for (const tx of transactions) {
        // 检查是否是从用户地址转入
        if (tx.from.toLowerCase() === order.userAddress.toLowerCase()) {
          // 检查金额是否匹配（允许±1%误差）
          const expectedAmount = order.fromAmount;
          const actualAmount = tx.value;
          const diff = Math.abs(actualAmount - expectedAmount);
          const tolerance = expectedAmount * 0.01; // 1%容差

          if (diff <= tolerance) {
            console.log(`✅ 订单 ${order.orderNumber} 收到USDT: ${actualAmount}`);
            
            // 更新订单状态
            order.receiveStatus = 'received';
            order.receiveTxHash = tx.txHash;
            order.receiveTime = new Date(tx.timestamp);
            order.receiveAmount = actualAmount;
            order.status = 'processing';
            order.updatedAt = new Date();
            await order.save();

            // 立即处理发送TRX
            await this.processSendTRX(order);
            break;
          }
        }
      }

    } catch (error) {
      console.error(`❌ 检查订单 ${order.orderNumber} 接收状态失败:`, error);
    }
  }

  // 处理发送TRX
  async processSendTRX(order) {
    try {
      console.log(`🔄 开始处理订单 ${order.orderNumber} 发送TRX...`);

      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('系统设置未找到');
      }

      // 获取钱包信息（从用户转入USDT的那个钱包发送TRX）
      const wallet = await this.getSwapWalletById(order.systemWalletId);

      if (!wallet) {
        throw new Error(`闪兑钱包未找到: ${order.systemWalletId}`);
      }

      // 初始化 TronWeb
      const tronWeb = await this.initTronWeb(settings, wallet);

      // 更新状态为处理中
      order.sendStatus = 'processing';
      order.updatedAt = new Date();
      await order.save();

      // 发送TRX
      const txHash = await this.sendTRX(
        tronWeb,
        order.userAddress,
        order.toAmount
      );

      console.log(`✅ 订单 ${order.orderNumber} TRX发送成功: ${txHash}`);

      // 更新订单状态
      order.sendStatus = 'completed';
      order.sendTxHash = txHash;
      order.sendTime = new Date();
      order.sendAmount = order.toAmount;
      order.status = 'completed';
      order.updatedAt = new Date();
      await order.save();

      // 发送邮件通知
      if (order.email && !order.emailSent) {
        await this.sendCompletionEmail(order);
      }

    } catch (error) {
      console.error(`❌ 订单 ${order.orderNumber} 发送TRX失败:`, error);
      
      order.sendStatus = 'failed';
      order.status = 'failed';
      order.errorMessage = error.message;
      order.updatedAt = new Date();
      await order.save();

      // 发送失败通知邮件
      if (order.email && !order.emailSent) {
        await this.sendFailureEmail(order, error.message);
      }
    }
  }

  // 初始化 TronWeb
  async initTronWeb(settings, wallet) {
    const { decryptPrivateKey, getMasterKey } = require('../utils/encryption');
    
    // 解密私钥
    const privateKey = decryptPrivateKey(wallet.privateKeyEncrypted, getMasterKey());

    // 获取API节点配置
    let apiNodes = [];
    try {
      apiNodes = JSON.parse(settings.tronApiNodes || '[]');
    } catch (e) {
      apiNodes = [];
    }

    // 找到第一个启用的节点
    const enabledNode = apiNodes.find(node => node.enabled && node.url);
    const fullHost = enabledNode ? enabledNode.url : 'https://api.trongrid.io';
    const headers = enabledNode?.apiKey ? { 'TRON-PRO-API-KEY': enabledNode.apiKey } : {};

    const tronWeb = new TronWeb({
      fullHost,
      headers,
      privateKey
    });

    return tronWeb;
  }

  // 获取USDT交易记录
  async getUSDTTransactions(tronWeb, address, sinceTime) {
    try {
      const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
      
      // 使用 TronGrid API 获取交易记录
      const url = `${tronWeb.fullNode.host}/v1/accounts/${address}/transactions/trc20`;
      const params = {
        limit: 50,
        contract_address: USDT_CONTRACT,
        only_to: true, // 只获取转入交易
        min_timestamp: sinceTime.getTime()
      };

      const response = await tronWeb.fullNode.request(url, params, 'get');
      
      if (!response.success || !response.data) {
        return [];
      }

      const transactions = [];
      for (const tx of response.data) {
        if (tx.type === 'Transfer' && tx.to === address) {
          transactions.push({
            txHash: tx.transaction_id,
            from: tx.from,
            to: tx.to,
            value: parseFloat(tx.value) / 1e6, // USDT有6位小数
            timestamp: tx.block_timestamp
          });
        }
      }

      return transactions;

    } catch (error) {
      console.error('获取USDT交易记录失败:', error);
      return [];
    }
  }

  // 发送TRX
  async sendTRX(tronWeb, toAddress, amount) {
    try {
      // 转换为Sun（1 TRX = 1,000,000 Sun）
      const amountInSun = Math.floor(amount * 1e6);

      // 发送交易
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        toAddress,
        amountInSun
      );

      const signedTx = await tronWeb.trx.sign(transaction);
      const result = await tronWeb.trx.sendRawTransaction(signedTx);

      if (!result.result) {
        throw new Error(result.message || '交易失败');
      }

      return result.txid;

    } catch (error) {
      console.error('发送TRX失败:', error);
      throw error;
    }
  }

  // 检查超时订单
  async checkTimeoutOrders() {
    try {
      const now = new Date();
      
      const timeoutOrders = await SwapOrder.find({
        status: { $in: ['pending', 'processing'] },
        receiveStatus: 'waiting',
        expiresAt: { $lt: now }
      });

      for (const order of timeoutOrders) {
        console.log(`⏰ 订单 ${order.orderNumber} 已超时`);
        
        order.receiveStatus = 'timeout';
        order.status = 'timeout';
        order.updatedAt = new Date();
        await order.save();

        // 发送超时通知邮件
        if (order.email && !order.emailSent) {
          await this.sendTimeoutEmail(order);
        }
      }

    } catch (error) {
      console.error('检查超时订单失败:', error);
    }
  }

  // 发送完成通知邮件
  async sendCompletionEmail(order) {
    try {
      const subject = `闪兑完成 - ${order.orderNumber}`;
      const html = `
        <h2>闪兑完成通知</h2>
        <p>您的USDT闪兑TRX订单已完成！</p>
        <ul>
          <li><strong>订单号:</strong> ${order.orderNumber}</li>
          <li><strong>兑换:</strong> ${order.fromAmount} USDT → ${order.toAmount} TRX</li>
          <li><strong>汇率:</strong> 1 USDT = ${order.exchangeRate} TRX</li>
          <li><strong>接收地址:</strong> ${order.userAddress}</li>
          <li><strong>交易哈希:</strong> ${order.sendTxHash}</li>
          <li><strong>完成时间:</strong> ${order.sendTime?.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</li>
        </ul>
        <p>感谢使用我们的服务！</p>
      `;

      await emailService.sendEmail(order.email, subject, html);
      
      order.emailSent = true;
      await order.save();

    } catch (error) {
      console.error('发送完成邮件失败:', error);
    }
  }

  // 发送失败通知邮件
  async sendFailureEmail(order, errorMessage) {
    try {
      const subject = `闪兑失败 - ${order.orderNumber}`;
      const html = `
        <h2>闪兑失败通知</h2>
        <p>很抱歉，您的USDT闪兑TRX订单处理失败。</p>
        <ul>
          <li><strong>订单号:</strong> ${order.orderNumber}</li>
          <li><strong>兑换:</strong> ${order.fromAmount} USDT → ${order.toAmount} TRX</li>
          <li><strong>失败原因:</strong> ${errorMessage}</li>
        </ul>
        <p>请联系客服处理，我们会尽快为您解决问题。</p>
      `;

      await emailService.sendEmail(order.email, subject, html);
      
      order.emailSent = true;
      await order.save();

    } catch (error) {
      console.error('发送失败邮件失败:', error);
    }
  }

  // 发送超时通知邮件
  async sendTimeoutEmail(order) {
    try {
      const subject = `闪兑超时 - ${order.orderNumber}`;
      const html = `
        <h2>闪兑超时通知</h2>
        <p>您的USDT闪兑TRX订单已超时。</p>
        <ul>
          <li><strong>订单号:</strong> ${order.orderNumber}</li>
          <li><strong>兑换:</strong> ${order.fromAmount} USDT → ${order.toAmount} TRX</li>
          <li><strong>创建时间:</strong> ${order.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</li>
          <li><strong>过期时间:</strong> ${order.expiresAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</li>
        </ul>
        <p>订单已自动取消。如有疑问，请联系客服。</p>
      `;

      await emailService.sendEmail(order.email, subject, html);
      
      order.emailSent = true;
      await order.save();

    } catch (error) {
      console.error('发送超时邮件失败:', error);
    }
  }

  // 从API获取 USDT/TRX 汇率
  async fetchSwapRateFromAPI() {
    try {
      // 方法1: 使用 CoinGecko API（免费，无地区限制）
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'tether,tron',
          vs_currencies: 'usd'
        },
        timeout: 10000
      });

      const usdtPrice = response.data.tether?.usd || 1; // USDT 通常约等于 1 USD
      const trxPriceInUsd = response.data.tron?.usd; // 1 TRX = X USD

      if (!trxPriceInUsd) {
        throw new Error('无法获取TRX价格');
      }

      // 计算 1 USDT = X TRX（取倒数）
      const rate = usdtPrice / trxPriceInUsd;
      
      console.log(`✅ 获取闪兑汇率成功 (CoinGecko): 1 USDT = ${rate.toFixed(4)} TRX`);
      return rate;

    } catch (error) {
      console.log(`ℹ️  CoinGecko API 暂时不可用，使用备用 API...`);
      
      // 备用方案：使用 Binance
      return this.fetchSwapRateFromBackupAPI();
    }
  }

  // 备用API：Binance
  async fetchSwapRateFromBackupAPI() {
    try {
      // 使用 Binance API 获取 TRX/USDT 交易对
      const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
        params: { symbol: 'TRXUSDT' },
        timeout: 10000
      });

      const trxPriceInUsdt = parseFloat(response.data.price); // 1 TRX = X USDT
      
      if (!trxPriceInUsdt || trxPriceInUsdt <= 0) {
        throw new Error('API返回的汇率无效');
      }

      // 我们需要的是 1 USDT = X TRX，所以要取倒数
      const rate = 1 / trxPriceInUsdt;

      console.log(`✅ 获取闪兑汇率成功 (Binance): 1 USDT = ${rate.toFixed(4)} TRX`);
      return rate;

    } catch (error) {
      console.error('❌ 所有API都失败:', error.message);
      
      // 返回默认值（基于当前市场价格 1 USDT ≈ 3.6 TRX）
      console.log('⚠️ 使用默认汇率: 3.6 TRX');
      return 3.6;
    }
  }

  // 计算闪兑汇率（TRX/USDT）
  async getSwapRate() {
    try {
      const settings = await Settings.findOne();
      if (!settings) {
        throw new Error('系统设置未找到');
      }

      let baseRate; // 基础汇率：1 USDT = X TRX

      if (settings.swapRateMode === 'realtime') {
        // 实时模式：直接从网上获取 USDT/TRX 汇率
        baseRate = await this.fetchSwapRateFromAPI();
      } else {
        // 手动模式：使用设置的闪兑汇率
        baseRate = settings.swapRateUSDTtoTRX || 6.7;
      }

      // 应用闪兑加成（用户换到的TRX减少）
      const swapMarkup = settings.swapRateMarkup || 0;
      const finalRate = baseRate * (1 - swapMarkup / 100);

      let receiveAddress = '';
      try {
        const wallets = JSON.parse(settings.swapWallets || '[]');
        const enabled = wallets.find((w) => w.enabled && w.address);
        receiveAddress = enabled ? enabled.address : '';
      } catch (e) {
        receiveAddress = '';
      }

      return {
        rate: parseFloat(finalRate.toFixed(6)),
        baseRate: parseFloat(baseRate.toFixed(6)),
        markup: swapMarkup,
        mode: settings.swapRateMode,
        receiveAddress
      };

    } catch (error) {
      console.error('获取闪兑汇率失败:', error);
      throw error;
    }
  }
}

// 创建单例
const swapService = new SwapService();

module.exports = swapService;
