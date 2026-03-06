#!/bin/bash

echo "继续诊断 vpnkk.com..."
echo ""

# 1. 查找 Nginx 配置文件
echo "【1】查找 Nginx 配置文件"
echo "-----------------------------------"
find /etc/nginx -name "*vpnkk*" 2>/dev/null
find /etc/nginx -name "*.conf" -exec grep -l "vpnkk.com" {} \; 2>/dev/null
echo ""

# 2. 查找部署目录
echo "【2】查找部署目录"
echo "-----------------------------------"
find /var/www -name "*vpnkk*" -type d 2>/dev/null
find /home -name "*vpnkk*" -type d 2>/dev/null
find /opt -name "*vpnkk*" -type d 2>/dev/null
echo ""

# 3. 检查 Nginx 主配置
echo "【3】检查 Nginx 主配置中的 vpnkk.com"
echo "-----------------------------------"
grep -r "vpnkk.com" /etc/nginx/ 2>/dev/null | head -20
echo ""

# 4. 检查当前运行的 Nginx 配置
echo "【4】检查 Nginx 进程"
echo "-----------------------------------"
ps aux | grep nginx
echo ""

# 5. 测试 Nginx 配置
echo "【5】测试 Nginx 配置"
echo "-----------------------------------"
nginx -t
echo ""

# 6. 查看完整的 HTML 内容（检查是否是静态文件）
echo "【6】检查返回的 HTML 类型"
echo "-----------------------------------"
curl -I https://vpnkk.com 2>&1 | grep -E "Content-Type|Server|X-"
echo ""

# 7. 检查是否有 landing.html
echo "【7】尝试访问 landing.html"
echo "-----------------------------------"
curl -I https://vpnkk.com/landing.html 2>&1 | grep "HTTP"
echo ""

# 8. 检查关键词（更详细）
echo "【8】关键词统计"
echo "-----------------------------------"
HTML=$(curl -A "Googlebot" -s https://vpnkk.com)
echo "TRXLP_bot: $(echo "$HTML" | grep -o "TRXLP_bot" | wc -l) 次"
echo "可可代付: $(echo "$HTML" | grep -o "可可代付" | wc -l) 次"
echo "TRX: $(echo "$HTML" | grep -o "TRX" | wc -l) 次"
echo "能量租赁: $(echo "$HTML" | grep -o "能量租赁" | wc -l) 次"
echo "波场: $(echo "$HTML" | grep -o "波场" | wc -l) 次"
echo ""

# 9. 检查 HTML 的前 100 行
echo "【9】HTML 内容预览（前 100 行）"
echo "-----------------------------------"
curl -A "Googlebot" -s https://vpnkk.com | head -100
echo ""

echo "诊断完成！"
