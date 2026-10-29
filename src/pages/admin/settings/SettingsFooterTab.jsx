export default function SettingsFooterTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">Footer自定义设置</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 自定义网站Footer的显示内容，包括公司名称、描述、版权信息和导航链接
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">公司名称</label>
                  <input
                    type="text"
                    value={settings.footerCompanyName || '可可代付'}
                    onChange={(e) => setSettings({ ...settings, footerCompanyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="可可代付"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">公司描述</label>
                  <textarea
                    value={settings.footerDescription || ''}
                    onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    rows="3"
                    placeholder="领先的自动化代付协议，为 TRON 生态提供安全、快速、便捷的 USDT 和 TRX 代付服务。"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">版权信息</label>
                  <input
                    type="text"
                    value={settings.footerCopyright || ''}
                    onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="© 2024 可可代付. All rights reserved."
                  />
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-black text-slate-800 mb-4">Footer导航菜单 (JSON格式)</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                    <p className="text-xs text-slate-600 mb-2">格式示例：</p>
                    <pre className="text-xs text-slate-700 overflow-x-auto">
{`[
  {
    "title": "产品服务",
    "links": [
      { "name": "USDT 代付", "url": "#" },
      { "name": "TRX 代付", "url": "#" }
    ]
  }
]`}
                    </pre>
                  </div>
                  <textarea
                    value={settings.footerLinks || ''}
                    onChange={(e) => setSettings({ ...settings, footerLinks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                    rows="8"
                  />
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-black text-slate-800 mb-4">Footer底部链接 (JSON格式)</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                    <p className="text-xs text-slate-600 mb-2">格式示例：</p>
                    <pre className="text-xs text-slate-700 overflow-x-auto">
{`[
  { "name": "隐私政策", "url": "#" },
  { "name": "服务协议", "url": "#" }
]`}
                    </pre>
                  </div>
                  <textarea
                    value={settings.footerBottomLinks || ''}
                    onChange={(e) => setSettings({ ...settings, footerBottomLinks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                    rows="4"
                  />
                </div>
              </div>
            
  );
}
