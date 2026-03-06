#!/bin/bash

# vpnkk.com SEO 诊断脚本
# 在 Linux 服务器上运行此脚本来诊断 SEO 问题

echo "========================================="
echo "  vpnkk.com SEO 诊断报告"
echo "========================================="
echo ""

# 1. 检查域名解析
echo "【1】检查域名解析"
echo "-----------------------------------"
echo "vpnkk.com 的 IP 地址："
dig +short vpnkk.com
echo ""
echo "dd.vpno.eu.org 的 IP 地址："
dig +short dd.vpno.eu.org
echo ""

# 2. 测试搜索引擎爬虫看到的内容
echo "【2】模拟 Googlebot 访问 vpnkk.com"
echo "-----------------------------------"
curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  -s https://vpnkk.com | grep -E "<title>|<meta name=\"description\"|<meta name=\"keywords\"" | head -5
echo ""

# 3. 检查 robots.txt
echo "【3】检查 robots.txt"
echo "-----------------------------------"
curl -s https://vpnkk.com/robots.txt | head -20
echo ""

# 4. 检查 sitemap.xml
echo "【4】检查 sitemap.xml"
echo "-----------------------------------"
curl -s https://vpnkk.com/sitemap.xml | grep -E "<loc>|<lastmod>" | head -20
echo ""

# 5. 检查服务器返回的 HTML 结构
echo "【5】检查 HTML 结构（前 50 行）"
echo "-----------------------------------"
curl -A "Googlebot" -s https://vpnkk.com | head -50
echo ""

# 6. 检查是否有 JSON-LD 结构化数据
echo "【6】检查结构化数据"
echo "-----------------------------------"
curl -A "Googlebot" -s https://vpnkk.com | grep -A 10 "application/ld+json"
echo ""

# 7. 检查响应头
echo "【7】检查 HTTP 响应头"
echo "-----------------------------------"
curl -I -A "Googlebot" https://vpnkk.com 2>&1 | grep -E "HTTP|Content-Type|X-|Cache"
echo ""

# 8. 检查是否有重定向
echo "【8】检查重定向"
echo "-----------------------------------"
echo "测试 http://vpnkk.com："
curl -I http://vpnkk.com 2>&1 | grep -E "HTTP|Location"
echo ""
echo "测试 https://vpnkk.com："
curl -I https://vpnkk.com 2>&1 | grep -E "HTTP|Location"
echo ""

# 9. 检查关键词密度
echo "【9】检查关键词出现次数"
echo "-----------------------------------"
HTML_CONTENT=$(curl -A "Googlebot" -s https://vpnkk.com)
echo "TRXLP_bot 出现次数: $(echo "$HTML_CONTENT" | grep -o "TRXLP_bot" | wc -l)"
echo "TRX 出现次数: $(echo "$HTML_CONTENT" | grep -o "TRX" | wc -l)"
echo "能量租赁 出现次数: $(echo "$HTML_CONTENT" | grep -o "能量租赁" | wc -l)"
echo "波场 出现次数: $(echo "$HTML_CONTENT" | grep -o "波场" | wc -l)"
echo "可可代付 出现次数: $(echo "$HTML_CONTENT" | grep -o "可可代付" | wc -l)"
echo ""

# 10. 检查 Nginx 配置（需要 root 权限）
echo "【10】检查 Nginx 配置"
echo "-----------------------------------"
if [ -f /etc/nginx/sites-available/vpnkk.com ]; then
    echo "找到 Nginx 配置文件："
    grep -E "server_name|root|location|rewrite|proxy_pass" /etc/nginx/sites-available/vpnkk.com | head -20
else
    echo "未找到 /etc/nginx/sites-available/vpnkk.com"
    echo "尝试查找其他配置文件..."
    find /etc/nginx -name "*vpnkk*" 2>/dev/null
fi
echo ""

# 11. 检查部署的文件
echo "【11】检查部署目录"
echo "-----------------------------------"
if [ -d /var/www/vpnkk.com ]; then
    echo "部署目录: /var/www/vpnkk.com"
    ls -lh /var/www/vpnkk.com/ | head -10
    echo ""
    echo "检查是否有 landing.html 或 index-seo.html："
    ls -lh /var/www/vpnkk.com/*.html 2>/dev/null
else
    echo "未找到 /var/www/vpnkk.com"
    echo "尝试查找部署目录..."
    find /var/www -name "*vpnkk*" -type d 2>/dev/null
fi
echo ""

# 12. 检查 SSL 证书
echo "【12】检查 SSL 证书"
echo "-----------------------------------"
echo | openssl s_client -servername vpnkk.com -connect vpnkk.com:443 2>/dev/null | \
  openssl x509 -noout -dates -subject 2>/dev/null
echo ""

# 13. 对比两个域名的内容
echo "【13】对比 vpnkk.com 和 dd.vpno.eu.org"
echo "-----------------------------------"
echo "vpnkk.com 的 title："
curl -A "Googlebot" -s https://vpnkk.com | grep -o "<title>.*</title>" | head -1
echo ""
echo "dd.vpno.eu.org 的 title："
curl -A "Googlebot" -s https://dd.vpno.eu.org | grep -o "<title>.*</title>" | head -1
echo ""

echo "========================================="
echo "  诊断完成！"
echo "========================================="
echo ""
echo "请将以上输出发送给我，我会帮你分析问题。"
echo ""
