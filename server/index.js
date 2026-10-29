const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 固定读项目根目录 .env，避免宝塔/PM2 工作目录在 server/ 时读不到
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { validateEnv, getAllowedOrigins } = require('./utils/env');
const { rateLimit } = require('./middleware/audit');

// 启动前校验环境
validateEnv();

const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const paymentRoutes = require('./routes/payments');
const settingsRoutes = require('./routes/settings');
const walletRoutes = require('./routes/wallet');
const walletsRoutes = require('./routes/wallets');
const usersRoutes = require('./routes/users');
const faqRoutes = require('./routes/faq');
const ticketsRoutes = require('./routes/tickets');
const swapRoutes = require('./routes/swap');
const telegramRoutes = require('./routes/telegram');
const telegramCommandsRoutes = require('./routes/telegram-commands');
const seoRoutes = require('./routes/seo');
const blogRoutes = require('./routes/blog');
const rewardRoutes = require('./routes/rewards');
const exchangeRateService = require('./services/exchangeRateService');
const orderTimeoutService = require('./services/orderTimeoutService');
const swapService = require('./services/swapService');
const walletUpdateService = require('./services/walletUpdateService');
const broadcastScheduler = require('./services/broadcastScheduler');
const { getBotManager } = require('./bot/MultiBotManager');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 开发环境放行本机
    if (
      process.env.NODE_ENV !== 'production' &&
      (origin.includes('localhost') || origin.includes('127.0.0.1'))
    ) {
      return callback(null, true);
    }

    console.error('❌ CORS 错误 - 不允许的来源:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

// 全局限流（宽松）；敏感路由在各自 router 再加严
const globalMax = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
app.use('/api', rateLimit(globalMax, 60000));

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fastpay')
  .then(() => {
    console.log('✅ MongoDB 连接成功');
    exchangeRateService.startAutoUpdate();
    orderTimeoutService.start();
    swapService.startMonitoring();
    walletUpdateService.start(60);
    broadcastScheduler.start(5);

    getBotManager().start().catch((err) => console.error('❌ Bot 启动失败:', err));
  })
  .catch((err) => console.error('❌ MongoDB 连接失败:', err));

app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/swap', swapRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/telegram-commands', telegramCommandsRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/rewards', rewardRoutes);

// 整站反代到 Node 时提供前端（需先在项目根目录 npm run build）
const distDir = path.join(__dirname, '..', 'dist');
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  app.use(express.static(distDir));
}
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!fs.existsSync(distIndex)) {
    return res
      .status(503)
      .type('text/plain; charset=utf-8')
      .send('前端未构建。请在网站根目录执行 npm run build 后重启 Node 项目。');
  }
  res.sendFile(distIndex);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
});
