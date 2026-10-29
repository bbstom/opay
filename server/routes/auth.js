const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');
const emailCodeStore = require('../utils/emailCodeStore');
const { auth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/audit');
const { getJwtSecret } = require('../utils/jwt');
const {
  setAuthCookie,
  clearAuthCookie,
  setPendingTwoFactor,
  readPendingTwoFactor
} = require('../utils/authCookie');
const totp = require('../utils/totp');
const { encryptPrivateKey, decryptPrivateKey, getMasterKey } = require('../utils/encryption');
const rewardService = require('../services/rewardService');
const crypto = require('crypto');
const {
  getEnabledTelegramBots,
  hmacTelegramPayload,
  telegramAuthHashMatches,
  telegramWebAppHashMatches
} = require('../utils/telegramBots');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,20}$/;

const signUser = (user) => jwt.sign(
  { userId: user._id, role: user.role },
  getJwtSecret(),
  { expiresIn: '7d' }
);

const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  totpEnabled: !!user.totpEnabled
});

const readTotpSecret = (encrypted) => {
  if (!encrypted) return '';
  try {
    return decryptPrivateKey(encrypted, getMasterKey());
  } catch {
    return '';
  }
};

const finishLogin = (req, res, user, status = 200) => {
  if (user.totpEnabled) {
    setPendingTwoFactor(res, req, user);
    return res.status(status).json({ requiresTwoFactor: true });
  }
  setAuthCookie(res, req, signUser(user));
  return res.status(status).json({ user: publicUser(user) });
};

const upsertTelegramUser = async ({ id, first_name, last_name, username, photo_url }) => {
  const telegramId = String(id);
  let user = await User.findOne({ telegramId });
  if (!user) {
    user = new User({
      username: username || `tg_${telegramId}`,
      email: `${telegramId}@telegram.user`,
      telegramId,
      telegramUsername: username,
      telegramFirstName: first_name,
      telegramLastName: last_name,
      telegramPhotoUrl: photo_url,
      source: 'telegram',
      password: crypto.randomBytes(32).toString('hex')
    });
    await user.save();
    await rewardService.afterUserCreated(user, '');
    return user;
  }
  user.telegramUsername = username;
  user.telegramFirstName = first_name;
  user.telegramLastName = last_name;
  user.telegramPhotoUrl = photo_url;
  await user.save();
  return user;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.post('/send-register-code', rateLimit(8, 60000), async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: '请输入有效邮箱' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const gate = emailCodeStore.canSend(email);
    if (!gate.ok) {
      return res.status(429).json({ error: `请 ${Math.ceil(gate.waitMs / 1000)} 秒后再发送` });
    }

    const settings = await Settings.findOne();
    const code = emailCodeStore.makeCode();
    emailCodeStore.put(email, code);
    const sent = await emailService.sendRegisterCodeEmail(email, code, settings);
    if (!sent.success) {
      emailCodeStore.consume(email);
      return res.status(503).json({ error: sent.message || '邮件服务未配置' });
    }
    res.json({ message: '验证码已发送' });
  } catch (error) {
    res.status(400).json({ error: '验证码发送失败' });
  }
});

router.post('/send-reset-code', rateLimit(8, 60000), async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: '请输入有效邮箱' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: '该邮箱未注册' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ error: '账户已禁用' });
    }

    const gate = emailCodeStore.canSend(email, 'reset');
    if (!gate.ok) {
      return res.status(429).json({ error: `请 ${Math.ceil(gate.waitMs / 1000)} 秒后再发送` });
    }

    const settings = await Settings.findOne();
    const code = emailCodeStore.makeCode();
    emailCodeStore.put(email, code, 'reset');
    const sent = await emailService.sendResetCodeEmail(email, code, settings);
    if (!sent.success) {
      emailCodeStore.consume(email, 'reset');
      return res.status(503).json({ error: sent.message || '邮件服务未配置' });
    }
    res.json({ message: '验证码已发送' });
  } catch (error) {
    res.status(400).json({ error: '验证码发送失败' });
  }
});

router.post('/reset-password', rateLimit(10, 60000), async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const newPassword = String(req.body.newPassword || req.body.password || '');

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: '请输入有效邮箱' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '密码至少 6 位' });
    }
    if (!emailCodeStore.verify(email, code, 'reset')) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: '该邮箱未注册' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ error: '账户已禁用' });
    }

    user.password = newPassword;
    await user.save();
    emailCodeStore.consume(email, 'reset');
    res.json({ message: '密码已重置' });
  } catch (error) {
    res.status(400).json({ error: '重置失败' });
  }
});

router.post('/register', rateLimit(20, 60000), async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const code = String(req.body.code || '').trim();
    const inviteCode = String(req.body.inviteCode || req.body.invite || '').trim();

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: '用户名为 3-20 位字母、数字、下划线或中文' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: '请输入有效邮箱' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 位' });
    }
    if (!emailCodeStore.verify(email, code)) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    const taken = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') } },
        { email }
      ]
    });
    if (taken) {
      return res.status(400).json({ error: '用户名或邮箱已被使用' });
    }

    const user = new User({ username, email, password, emailVerified: true, source: 'web' });
    await user.save();
    emailCodeStore.consume(email);
    await rewardService.afterUserCreated(user, inviteCode);

    finishLogin(req, res, user, 201);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: '用户名或邮箱已被使用' });
    }
    res.status(400).json({ error: '注册失败' });
  }
});

router.post('/login', rateLimit(20, 60000), async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') }
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ error: '账户已禁用' });
    }

    finishLogin(req, res, user);
  } catch (error) {
    res.status(400).json({ error: '登录失败' });
  }
});

router.post('/login/2fa', rateLimit(20, 60000), async (req, res) => {
  try {
    const pending = readPendingTwoFactor(req);
    if (!pending) {
      return res.status(401).json({ error: '请先完成用户名密码登录' });
    }
    const user = await User.findById(pending.userId);
    if (!user || user.status === 'disabled' || !user.totpEnabled) {
      return res.status(401).json({ error: '二次验证无效' });
    }
    const secret = readTotpSecret(user.totpSecretEncrypted);
    if (!totp.verify(secret, req.body.code)) {
      return res.status(401).json({ error: '验证码错误' });
    }
    setAuthCookie(res, req, signUser(user));
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ error: '二次验证失败' });
  }
});

router.post('/logout', async (req, res) => {
  clearAuthCookie(res, req);
  res.json({ message: '已退出' });
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -totpSecretEncrypted -totpTempSecretEncrypted');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 更新用户信息
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: '该邮箱已被使用' });
      }
      user.email = email;
    }

    if (username) {
      user.username = username;
    }

    await user.save();
    
    res.json({ 
      message: '更新成功',
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 修改密码
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证当前密码
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({ message: '密码修改成功' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Telegram 登录
router.post('/telegram-login', rateLimit(30, 60000), async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

    const settings = await Settings.findOne();
    const botTokens = getEnabledTelegramBots(settings).map((bot) => bot.token);
    if (!botTokens.length) {
      return res.status(500).json({ error: 'Telegram Bot 未配置' });
    }

    if (!telegramAuthHashMatches(req.body, botTokens)) {
      return res.status(401).json({ error: 'Telegram 数据验证失败' });
    }

    // 检查数据是否过期（24小时）
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - auth_date > 86400) {
      return res.status(401).json({ error: 'Telegram 登录已过期，请重新登录' });
    }

    const user = await upsertTelegramUser({ id, first_name, last_name, username, photo_url });
    finishLogin(req, res, user);
  } catch (error) {
    console.error('Telegram 登录错误:', error);
    res.status(400).json({ error: error.message });
  }
});

// Mini App initData 登录（与 Login Widget 哈希算法不同）
router.post('/telegram-webapp', rateLimit(30, 60000), async (req, res) => {
  try {
    const initData = String(req.body.initData || '');
    if (!initData) {
      return res.status(400).json({ error: '缺少 initData' });
    }

    const settings = await Settings.findOne();
    const botTokens = getEnabledTelegramBots(settings).map((bot) => bot.token);
    if (!botTokens.length) {
      return res.status(500).json({ error: 'Telegram Bot 未配置' });
    }

    const checked = telegramWebAppHashMatches(initData, botTokens);
    if (!checked.ok || !checked.parsed.user?.id) {
      return res.status(401).json({ error: 'Telegram 数据验证失败' });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - checked.parsed.authDate > 86400) {
      return res.status(401).json({ error: 'Telegram 登录已过期，请重新打开' });
    }

    const tgUser = checked.parsed.user;
    const user = await upsertTelegramUser({
      id: tgUser.id,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      username: tgUser.username,
      photo_url: tgUser.photo_url
    });
    finishLogin(req, res, user);
  } catch (error) {
    console.error('Telegram Mini App 登录错误:', error);
    res.status(400).json({ error: error.message });
  }
});

// 检查二维码登录状态
router.get('/check-qr-login', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: '缺少 token 参数' });
    }

    // 从 Redis 或内存中查找登录状态
    // 这里使用简单的内存存储（生产环境应该使用 Redis）
    const loginData = global.qrLoginSessions?.[token];
    
    if (loginData && loginData.userData) {
      console.log('✅ 检测到登录成功:', {
        token: token.substring(0, 20) + '...',
        telegramId: loginData.userData.id
      });
      
      // 不要清除 token，让 complete 端点来清除
      // delete global.qrLoginSessions[token];
      
      return res.json({
        success: true,
        token: token  // 返回 token 供前端调用 complete 端点
      });
    }
    
    // 不打印太多日志，避免刷屏
    // console.log('⏳ 等待登录确认:', token.substring(0, 20) + '...');
    res.json({ success: false });
  } catch (error) {
    console.error('检查登录状态错误:', error);
    res.status(400).json({ error: error.message });
  }
});

// 完成二维码登录（前端调用，直接返回 JWT token）
router.post('/qr-login-complete', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: '缺少 token 参数' });
    }

    // 从内存中获取登录数据
    const loginData = global.qrLoginSessions?.[token];
    
    if (!loginData || !loginData.userData) {
      return res.status(401).json({ error: '登录会话已过期或无效' });
    }

    const userData = loginData.userData;
    
    // 清除已使用的 token
    delete global.qrLoginSessions[token];
    
    // 查找或创建用户（自动注册）
    let user = await User.findOne({ telegramId: userData.id.toString() });
    
    if (!user) {
      // 自动创建新用户，无需先 /start
      const crypto = require('crypto');
      user = new User({
        username: userData.username || `tg_${userData.id}`,
        email: `${userData.id}@telegram.user`,
        telegramId: userData.id.toString(),
        telegramUsername: userData.username,
        telegramFirstName: userData.first_name,
        telegramLastName: userData.last_name,
        telegramPhotoUrl: userData.photo_url,
        password: crypto.randomBytes(32).toString('hex')
      });
      await user.save();
      await rewardService.afterUserCreated(user, '');
      console.log('✅ 自动创建新用户（无需 /start）:', user.username);
    }

    finishLogin(req, res, user);
  } catch (error) {
    console.error('❌ 完成登录错误:', error);
    res.status(400).json({ error: error.message });
  }
});

// 确认二维码登录（由 Bot 调用）
router.post('/confirm-qr-login', async (req, res) => {
  try {
    const { token, telegramId, username, firstName, lastName, photoUrl } = req.body;
    
    console.log('🔐 收到登录确认请求:', {
      token,
      telegramId,
      username,
      firstName
    });
    
    if (!token || !telegramId) {
      console.error('❌ 缺少必要参数');
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 查找或创建用户
    let user = await User.findOne({ telegramId: telegramId.toString() });
    
    if (!user) {
      const crypto = require('crypto');
      user = new User({
        username: username || `tg_${telegramId}`,
        email: `${telegramId}@telegram.user`,
        telegramId: telegramId.toString(),
        telegramUsername: username,
        telegramFirstName: firstName,
        telegramLastName: lastName,
        telegramPhotoUrl: photoUrl,
        password: crypto.randomBytes(32).toString('hex')
      });
      await user.save();
      await rewardService.afterUserCreated(user, '');
      console.log('✅ 创建新用户:', user.username);
    } else {
      user.telegramUsername = username;
      user.telegramFirstName = firstName;
      user.telegramLastName = lastName;
      user.telegramPhotoUrl = photoUrl;
      await user.save();
      console.log('✅ 更新用户信息:', user.username);
    }

    // 生成用户数据（包含验证信息）
    const userData = {
      id: telegramId,
      first_name: firstName,
      last_name: lastName,
      username: username,
      photo_url: photoUrl,
      auth_date: Math.floor(Date.now() / 1000)
    };

    const settings = await Settings.findOne();
    const botToken = (getEnabledTelegramBots(settings)[0] || {}).token;
    if (!botToken) {
      throw new Error('未配置 Telegram Bot Token');
    }

    userData.hash = hmacTelegramPayload(userData, botToken);

    // 存储登录数据（使用全局变量，生产环境应该使用 Redis）
    if (!global.qrLoginSessions) {
      global.qrLoginSessions = {};
    }
    global.qrLoginSessions[token] = {
      userData,
      timestamp: Date.now()
    };

    console.log('✅ 登录数据已存储:', {
      token,
      sessionCount: Object.keys(global.qrLoginSessions).length
    });

    // 5分钟后自动清除
    setTimeout(() => {
      if (global.qrLoginSessions?.[token]) {
        delete global.qrLoginSessions[token];
        console.log('🗑️  清除过期登录会话:', token);
      }
    }, 300000);

    res.json({ success: true, message: '登录确认成功' });
  } catch (error) {
    console.error('❌ 确认登录错误:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/2fa/status', auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select('totpEnabled');
  res.json({ enabled: !!user?.totpEnabled, allowed: true });
});

router.post('/2fa/setup', auth, rateLimit(10, 60000), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (user.totpEnabled) {
      return res.status(400).json({ error: '已启用二次验证，请先关闭后再重新绑定' });
    }
    const secret = totp.generateSecret();
    user.totpTempSecretEncrypted = encryptPrivateKey(secret, getMasterKey());
    await user.save();
    const otpauth = totp.otpauthURL(secret, user.username);
    res.json({ otpauth, secret });
  } catch (error) {
    res.status(400).json({ error: '无法生成二次验证密钥' });
  }
});

router.post('/2fa/enable', auth, rateLimit(10, 60000), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const secret = readTotpSecret(user.totpTempSecretEncrypted);
    if (!secret) return res.status(400).json({ error: '请先获取绑定二维码' });
    if (!totp.verify(secret, req.body.code)) {
      return res.status(400).json({ error: '验证码错误' });
    }
    user.totpSecretEncrypted = user.totpTempSecretEncrypted;
    user.totpTempSecretEncrypted = '';
    user.totpEnabled = true;
    await user.save();
    res.json({ message: '二次验证已启用', user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ error: '启用二次验证失败' });
  }
});

router.post('/2fa/disable', auth, rateLimit(10, 60000), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const secret = readTotpSecret(user.totpSecretEncrypted);
    if (!totp.verify(secret, req.body.code)) {
      return res.status(400).json({ error: '验证码错误' });
    }
    user.totpEnabled = false;
    user.totpSecretEncrypted = '';
    user.totpTempSecretEncrypted = '';
    await user.save();
    res.json({ message: '二次验证已关闭', user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ error: '关闭二次验证失败' });
  }
});

module.exports = router;
