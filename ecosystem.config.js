const path = require('path');

// 密钥不要写在这个文件里。生产用宝塔 PM2 环境变量注入。
module.exports = {
  apps: [{
    name: 'easypay-backend',
    script: path.join(__dirname, 'server/index.js'),
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/root/.pm2/logs/easypay-error.log',
    out_file: '/root/.pm2/logs/easypay-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
