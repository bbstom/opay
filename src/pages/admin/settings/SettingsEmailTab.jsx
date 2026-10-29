export default function SettingsEmailTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">SMTP邮件配置</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 配置SMTP后，系统将在订单完成时自动发送邮件通知给用户（如果用户填写了邮箱）
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">SMTP服务器</label>
                    <input
                      type="text"
                      value={settings.smtpHost || ''}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">SMTP端口</label>
                    <input
                      type="number"
                      value={settings.smtpPort || 465}
                      onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">使用SSL/TLS</label>
                  <select
                    value={settings.smtpSecure ? 'true' : 'false'}
                    onChange={(e) => setSettings({ ...settings, smtpSecure: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  >
                    <option value="true">是 (推荐，端口465)</option>
                    <option value="false">否 (端口587)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">SMTP用户名</label>
                  <input
                    type="text"
                    value={settings.smtpUser || ''}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">SMTP密码</label>
                  <input
                    type="password"
                    value={settings.smtpPass || ''}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="应用专用密码"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">发件人名称</label>
                    <input
                      type="text"
                      value={settings.smtpFromName || '可可代付'}
                      onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">发件人邮箱</label>
                    <input
                      type="email"
                      value={settings.smtpFromEmail || ''}
                      onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">常用SMTP配置参考</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>• Gmail: smtp.gmail.com, 端口465 (SSL) 或 587 (TLS)</p>
                    <p>• QQ邮箱: smtp.qq.com, 端口465 (SSL) 或 587 (TLS)</p>
                    <p>• 163邮箱: smtp.163.com, 端口465 (SSL) 或 25 (无加密)</p>
                    <p>• Outlook: smtp-mail.outlook.com, 端口587 (TLS)</p>
                  </div>
                </div>
              </div>
            
  );
}
