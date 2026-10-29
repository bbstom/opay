export default function SettingsSiteTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">网站基本信息</h2>
                
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">网站名称</label>
                  <input
                    type="text"
                    value={settings.siteName || ''}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">网站 Logo</label>
                  <input
                    type="url"
                    value={settings.siteLogo || ''}
                    onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    导航栏显示的 Logo，支持 .png、.svg、.jpg 格式，推荐尺寸：200x200 或更大
                  </p>
                </div>

                {settings.siteLogo && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Logo 预览</h3>
                    <div className="flex items-center gap-4">
                      <img 
                        src={settings.siteLogo} 
                        alt="Logo预览" 
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-sm text-red-500">
                        ❌ Logo 加载失败，请检查URL是否正确
                      </div>
                      <div className="text-sm text-slate-600">
                        <p className="font-medium">导航栏效果预览</p>
                        <p className="text-xs text-slate-500">保存后刷新页面即可看到效果</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">网站图标 (Favicon)</label>
                  <input
                    type="url"
                    value={settings.siteFavicon || ''}
                    onChange={(e) => setSettings({ ...settings, siteFavicon: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="https://example.com/favicon.ico"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    浏览器标签页显示的图标，支持 .ico、.png、.svg 格式，推荐尺寸：32x32 或 64x64
                  </p>
                </div>

                {settings.siteFavicon && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">图标预览</h3>
                    <div className="flex items-center gap-4">
                      <img 
                        src={settings.siteFavicon} 
                        alt="Favicon预览" 
                        className="w-8 h-8"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-sm text-red-500">
                        ❌ 图标加载失败，请检查URL是否正确
                      </div>
                      <div className="text-sm text-slate-600">
                        <p className="font-medium">标签页效果预览</p>
                        <p className="text-xs text-slate-500">保存后刷新页面即可看到效果</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">网站描述</label>
                  <textarea
                    value={settings.siteDescription || ''}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">SEO标题</label>
                  <input
                    type="text"
                    value={settings.seoTitle || ''}
                    onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">SEO描述</label>
                  <textarea
                    value={settings.seoDescription || ''}
                    onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    rows="3"
                  />
                </div>
              </div>
            
  );
}
