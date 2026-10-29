/**
 * 数据库初始化（非交互）
 * 空库：创建管理员、系统配置、示例 FAQ
 * 已有管理员或配置时跳过；FORCE_RESET=1 时重建用户 / 配置 / FAQ / 钱包
 *
 * 环境变量：
 *   MONGODB_URI      必填
 *   ADMIN_USERNAME   默认 admin
 *   ADMIN_EMAIL      默认 admin@example.com
 *   ADMIN_PASSWORD   默认 admin123（登录后立刻改）
 *   SITE_NAME        默认 可可代付
 *   FORCE_RESET=1    强制重建上述基础数据（不删订单）
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');
const FAQ = require('../models/FAQ');
const Wallet = require('../models/Wallet');

const FORCE = process.env.FORCE_RESET === '1';
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'admin123');
const SITE_NAME = String(process.env.SITE_NAME || '可可代付').trim();
const passwordFromEnv = Boolean(process.env.ADMIN_PASSWORD);

const redactUri = (uri) => String(uri || '').replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');

const FAQS = [
  {
    question: '如何进行 USDT 代付？',
    answer: '进入「USDT 代付」页面，填写收款地址与数量，选择支付方式后提交订单，按提示完成付款即可。链上到账通常需要 2-10 分钟。',
    category: '代付',
    order: 1,
    enabled: true
  },
  {
    question: '支持哪些支付方式？',
    answer: '默认支持微信支付；支付宝需在后台开启。具体以页面展示为准。',
    category: '支付',
    order: 2,
    enabled: true
  },
  {
    question: '订单超时怎么办？',
    answer: '未支付订单会在超时后自动关闭。如已付款但未到账，请携带订单号联系客服处理。',
    category: '订单',
    order: 3,
    enabled: true
  },
  {
    question: '闪兑如何使用？',
    answer: '在闪兑中心输入金额与您的 TRON 地址，按提示向系统地址转入 USDT，确认后系统自动兑出 TRX。',
    category: '闪兑',
    order: 4,
    enabled: true
  }
];

async function printSummary() {
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('\n集合统计:');
  for (const c of cols) {
    const n = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(` - ${c.name}: ${n}`);
  }
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('未配置 MONGODB_URI');
  }

  console.log('连接:', redactUri(uri));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ MongoDB 已连接 →', mongoose.connection.db.databaseName);

  const adminCount = await User.countDocuments({ role: 'admin' });
  const settingsCount = await Settings.countDocuments();
  const faqCount = await FAQ.countDocuments();
  const walletCount = await Wallet.countDocuments();
  console.log('现状:', { adminCount, settingsCount, faqCount, walletCount });

  if ((adminCount > 0 || settingsCount > 0) && !FORCE) {
    console.log('⚠️  已有数据，跳过初始化。若需重建基础数据请设 FORCE_RESET=1');
    await printSummary();
    return;
  }

  if (FORCE) {
    console.log('🗑️  FORCE_RESET：清空 users / settings / faqs / wallets');
    await Promise.all([
      User.deleteMany({}),
      Settings.deleteMany({}),
      FAQ.deleteMany({}),
      Wallet.deleteMany({})
    ]);
  }

  // User.pre('save') 会哈希密码，这里传明文
  await User.create({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    status: 'active',
    source: 'web',
    emailVerified: true
  });
  console.log('✅ 管理员:', ADMIN_USERNAME, '/', ADMIN_EMAIL);
  if (passwordFromEnv) {
    console.log('   密码已使用 ADMIN_PASSWORD（不回显），登录后请修改');
  } else {
    console.log('   默认密码: admin123  （请立即登录修改）');
  }

  await Settings.create({
    siteName: SITE_NAME,
    footerCompanyName: SITE_NAME,
    smtpFromName: SITE_NAME,
    telegramBots: JSON.stringify([]),
    swapWallets: JSON.stringify([]),
    systemStartTime: new Date()
  });
  console.log('✅ 系统配置:', SITE_NAME);

  await FAQ.insertMany(FAQS);
  console.log('✅ FAQ:', FAQS.length, '条');

  await printSummary();
  console.log('\n🎉 初始化完成');
  console.log('登录后台后配置：支付网关、代付钱包、Telegram Bot Token、TRX 充值地址');
}

seed()
  .catch((e) => {
    console.error('❌ 失败:', e.message || e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
