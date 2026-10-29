const { verifyToken } = require('../utils/jwt');
const { readAuthToken } = require('../utils/authCookie');
const { ipWhitelistCheck } = require('./audit');

const auth = (req, res, next) => {
  try {
    const token = readAuthToken(req);
    if (!token) throw new Error('no token');

    const decoded = verifyToken(token);
    if (decoded.purpose) throw new Error('wrong token');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '请先登录' });
  }
};

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  return ipWhitelistCheck(req, res, next);
};

module.exports = { auth, adminAuth };
