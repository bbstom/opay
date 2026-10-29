export default function SettingsFeeTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">服务费设置</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>提示：</strong>代付系统的阶梯费率请在"代付系统 → 费率设置"中配置
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">费率类型</label>
                  <select
                    value={settings.feeType}
                    onChange={(e) => setSettings({ ...settings, feeType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  >
                    <option value="fixed">固定费用</option>
                    <option value="percentage">百分比费率</option>
                  </select>
                </div>

                {settings.feeType === 'fixed' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-600 block mb-2">USDT 服务费 (CNY)</label>
                      <input
                        type="number"
                        value={settings.feeUSDT}
                        onChange={(e) => setSettings({ ...settings, feeUSDT: parseFloat(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-600 block mb-2">TRX 服务费 (CNY)</label>
                      <input
                        type="number"
                        value={settings.feeTRX}
                        onChange={(e) => setSettings({ ...settings, feeTRX: parseFloat(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">服务费百分比 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.feePercentage}
                      onChange={(e) => setSettings({ ...settings, feePercentage: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    />
                  </div>
                )}
              </div>
            
  );
}
