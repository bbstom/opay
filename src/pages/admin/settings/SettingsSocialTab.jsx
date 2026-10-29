export default function SettingsSocialTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">社交媒体链接</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 配置社交媒体链接后，将在网站Footer显示对应的图标
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">Twitter</label>
                    <input
                      type="url"
                      value={settings.socialTwitter || ''}
                      onChange={(e) => setSettings({ ...settings, socialTwitter: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="https://twitter.com/yourcompany"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">Facebook</label>
                    <input
                      type="url"
                      value={settings.socialFacebook || ''}
                      onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="https://facebook.com/yourcompany"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">Telegram</label>
                    <input
                      type="url"
                      value={settings.socialTelegram || ''}
                      onChange={(e) => setSettings({ ...settings, socialTelegram: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="https://t.me/yourcompany"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">微信</label>
                    <input
                      type="text"
                      value={settings.socialWeChat || ''}
                      onChange={(e) => setSettings({ ...settings, socialWeChat: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="微信号或二维码链接"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">联系邮箱</label>
                    <input
                      type="email"
                      value={settings.socialEmail || ''}
                      onChange={(e) => setSettings({ ...settings, socialEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="contact@yourcompany.com"
                    />
                  </div>
                </div>
              </div>
            
  );
}
