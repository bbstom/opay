# 可可代付

USDT / TRX 代付平台：网站 + 管理后台 + Telegram Bot。

生产部署（宝塔 + Nginx + PM2）见 **[部署教程.md](./部署教程.md)**。

## 本地开发

```bash
cp .env.example .env
npm install
npm run init-db
npm run dev
```

需要的环境变量见 `.env.example`。钱包私钥加密用 `ENCRYPTION_KEY`，Telegram Token 在后台配置。

```bash
npm run generate-key    # 生成 ENCRYPTION_KEY
npm run init-db         # 初始化管理员和系统配置
npm run build           # 生产前端
pm2 start ecosystem.config.js
```
