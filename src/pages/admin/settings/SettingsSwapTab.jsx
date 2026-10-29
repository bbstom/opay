export default function SettingsSwapTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">USDT闪兑TRX设置</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 闪兑功能允许用户直接用USDT兑换TRX，系统自动处理转账<br/>
                    闪兑汇率独立于代付汇率，可以单独设置
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-700">启用闪兑功能</span>
                    <p className="text-xs text-slate-500 mt-1">关闭后用户将无法访问闪兑页面</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.swapEnabled}
                      onChange={(e) => setSettings({ ...settings, swapEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0095ff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0095ff]"></div>
                  </label>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">闪兑汇率模式</label>
                  <select
                    value={settings.swapRateMode}
                    onChange={(e) => setSettings({ ...settings, swapRateMode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  >
                    <option value="manual">手动设置</option>
                    <option value="realtime">实时计算（基于代付汇率）</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    手动模式：直接设置 1 USDT = X TRX<br/>
                    实时模式：根据代付汇率自动计算（TRX的CNY价格 / USDT的CNY价格）
                  </p>
                </div>

                {settings.swapRateMode === 'manual' ? (
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">
                      闪兑汇率（1 USDT = ? TRX）
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={settings.swapRateUSDTtoTRX}
                      onChange={(e) => setSettings({ ...settings, swapRateUSDTtoTRX: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="例如: 6.7"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      示例：设置为 6.7，表示用户用 1 USDT 可以换到 6.7 TRX（加成前）
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-green-800 mb-2">实时计算汇率</h3>
                    {rateInfo && rateInfo.originalRates?.USDT && rateInfo.originalRates?.TRX ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">USDT汇率:</span>
                          <span className="font-bold text-green-900">{rateInfo.originalRates.USDT} CNY</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">TRX汇率:</span>
                          <span className="font-bold text-green-900">{rateInfo.originalRates.TRX} CNY</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-green-200">
                          <span className="text-green-700">计算结果 (1 USDT):</span>
                          <span className="font-bold text-green-900">
                            {(rateInfo.originalRates.TRX / rateInfo.originalRates.USDT).toFixed(6)} TRX
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-green-700">请先在"汇率设置"中获取实时汇率</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">
                    闪兑汇率加成 (%)
                    <span className="text-xs text-slate-400 ml-2">用户换到的TRX会减少这个百分比</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.swapRateMarkup}
                    onChange={(e) => setSettings({ ...settings, swapRateMarkup: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="例如: 2 表示用户换到的TRX减少2%"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    示例：基础汇率 6.7 TRX/USDT，加成2%后，用户实际得到 6.566 TRX
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">最小兑换金额 (USDT)</label>
                    <input
                      type="number"
                      value={settings.swapMinAmount}
                      onChange={(e) => setSettings({ ...settings, swapMinAmount: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">最大兑换金额 (USDT)</label>
                    <input
                      type="number"
                      value={settings.swapMaxAmount}
                      onChange={(e) => setSettings({ ...settings, swapMaxAmount: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">订单超时时间 (分钟)</label>
                  <input
                    type="number"
                    value={settings.swapOrderTimeout}
                    onChange={(e) => setSettings({ ...settings, swapOrderTimeout: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    用户需要在此时间内完成USDT转账，否则订单自动取消
                  </p>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-cyan-800 mb-2">最终闪兑汇率预览</h3>
                  <div className="space-y-2 text-sm">
                    {settings.swapRateMode === 'manual' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-cyan-700">基础汇率:</span>
                          <span className="font-bold text-cyan-900">{settings.swapRateUSDTtoTRX} TRX/USDT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-700">加成:</span>
                          <span className="font-bold text-cyan-900">{settings.swapRateMarkup}%</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-cyan-200">
                          <span className="text-cyan-700">用户实际得到 (1 USDT):</span>
                          <span className="font-bold text-cyan-900">
                            {(settings.swapRateUSDTtoTRX * (1 - settings.swapRateMarkup / 100)).toFixed(6)} TRX
                          </span>
                        </div>
                      </>
                    ) : rateInfo && rateInfo.originalRates?.USDT && rateInfo.originalRates?.TRX ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-cyan-700">基础汇率:</span>
                          <span className="font-bold text-cyan-900">
                            {(rateInfo.originalRates.TRX / rateInfo.originalRates.USDT).toFixed(6)} TRX/USDT
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan-700">加成:</span>
                          <span className="font-bold text-cyan-900">{settings.swapRateMarkup}%</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-cyan-200">
                          <span className="text-cyan-700">用户实际得到 (1 USDT):</span>
                          <span className="font-bold text-cyan-900">
                            {((rateInfo.originalRates.TRX / rateInfo.originalRates.USDT) * (1 - settings.swapRateMarkup / 100)).toFixed(6)} TRX
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-cyan-700">请先配置汇率</p>
                    )}
                  </div>
                </div>
              </div>
            
  );
}
