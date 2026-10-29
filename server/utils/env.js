/**
 * 启动时环境变量校验
 * development 仅警告；production 缺关键项直接退出
 */

const REQUIRED_ALWAYS = ['MONGODB_URI', 'JWT_SECRET'];
const REQUIRED_PRODUCTION = ['ENCRYPTION_KEY', 'APP_URL'];

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function validateEnv() {
  const missing = [];
  const warnings = [];

  for (const key of REQUIRED_ALWAYS) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      missing.push(key);
    }
  }

  // 禁止弱 JWT
  const jwt = process.env.JWT_SECRET || '';
  if (jwt && (jwt === 'secret' || jwt === 'your-super-secret-jwt-key-change-this-to-random-string' || jwt.length < 16)) {
    if (isProduction()) {
      missing.push('JWT_SECRET(过弱，需至少16位且非默认值)');
    } else {
      warnings.push('JWT_SECRET 过弱，生产环境必须更换');
    }
  }

  if (isProduction()) {
    for (const key of REQUIRED_PRODUCTION) {
      if (!process.env[key] || String(process.env[key]).trim() === '') {
        missing.push(key);
      }
    }
  } else {
    if (!process.env.ENCRYPTION_KEY) {
      warnings.push('未配置 ENCRYPTION_KEY，钱包加解密将依赖 JWT_SECRET');
    }
  }

  warnings.forEach((w) => console.warn(`⚠️  环境变量警告: ${w}`));

  if (missing.length > 0) {
    const msg = `缺少必要环境变量: ${missing.join(', ')}`;
    if (isProduction()) {
      console.error(`❌ ${msg}`);
      console.error('请检查 .env 后重启服务');
      process.exit(1);
    }
    console.warn(`⚠️  ${msg}（开发环境继续启动）`);
  } else {
    console.log('✅ 环境变量校验通过');
  }
}

/** 解析 CORS 允许来源列表 */
function getAllowedOrigins() {
  const fromEnv = [
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN
  ]
    .filter(Boolean)
    .flatMap((v) => String(v).split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  const defaults = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ];

  return [...new Set([...defaults, ...fromEnv])];
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (isProduction()) {
      throw new Error('JWT_SECRET 未配置');
    }
    console.warn('⚠️  JWT_SECRET 未配置，开发环境使用临时密钥（勿用于生产）');
    return 'dev-only-insecure-jwt-secret';
  }
  return secret;
}

module.exports = {
  validateEnv,
  getAllowedOrigins,
  getJwtSecret,
  isProduction
};
