export default function SettingsRuntimeTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">运行时间配置</h2>
                
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-green-800">
                    💡 设置系统运行起始时间，将在网站底部显示系统已运行的天数、小时、分钟和秒数
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">系统运行起始时间</label>
                  <input
                    type="datetime-local"
                    value={settings.systemStartTime ? new Date(settings.systemStartTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setSettings({ ...settings, systemStartTime: new Date(e.target.value).toISOString() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">选择系统开始运行的日期和时间</p>
                </div>

                {settings.systemStartTime && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-2">当前设置</h3>
                    <p className="text-sm text-slate-600">
                      起始时间：{new Date(settings.systemStartTime).toLocaleString('zh-CN')}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      系统将从这个时间开始计算运行时长
                    </p>
                  </div>
                )}
              </div>
            
  );
}
