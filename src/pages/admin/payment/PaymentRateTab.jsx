import { RefreshCw } from 'lucide-react';

export default function PaymentRateTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates,
  wallets, selectedWallet, showAddWallet, newWallet, showPrivateKey, loading,
  handleToggleWalletStatus, handleViewWallet, handleBackToList, handleAddWallet,
  handleDeleteWallet, handleRefreshWallet, setShowAddWallet, setNewWallet, setShowPrivateKey }) {
  return (

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">代付汇率设置</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                💡 代付汇率用于计算用户支付的人民币金额<br/>
                实时汇率模式：自动从CoinGecko获取最新汇率（每小时更新）<br/>
                手动模式：使用您设置的固定汇率
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">汇率模式</label>
              <select
                value={settings.exchangeRateMode}
                onChange={(e) => setSettings({ ...settings, exchangeRateMode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
              >
                <option value="realtime">实时汇率（推荐）</option>
                <option value="manual">手动设置</option>
              </select>
            </div>

            {settings.exchangeRateMode === 'realtime' && rateInfo && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-green-800">当前实时汇率</h3>
                  <button
                    onClick={handleRefreshRates}
                    disabled={refreshingRates}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={refreshingRates ? 'animate-spin' : ''} />
                    {refreshingRates ? '更新中...' : '手动更新'}
                  </button>
                </div>
                
                {rateInfo.originalRates?.USDT && rateInfo.originalRates?.TRX ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700 font-medium">USDT:</span>
                        <span className="text-green-900 font-bold ml-2">{rateInfo.originalRates.USDT} CNY</span>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">TRX:</span>
                        <span className="text-green-900 font-bold ml-2">{rateInfo.originalRates.TRX} CNY</span>
                      </div>
                    </div>
                    
                    {settings.exchangeRateMarkup > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-green-700 font-medium mb-1">加成后汇率 (+{settings.exchangeRateMarkup}%):</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700 font-medium">USDT:</span>
                            <span className="text-green-900 font-bold ml-2">
                              {(rateInfo.originalRates.USDT * (1 + settings.exchangeRateMarkup / 100)).toFixed(4)} CNY
                            </span>
                          </div>
                          <div>
                            <span className="text-green-700 font-medium">TRX:</span>
                            <span className="text-green-900 font-bold ml-2">
                              {(rateInfo.originalRates.TRX * (1 + settings.exchangeRateMarkup / 100)).toFixed(4)} CNY
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {rateInfo.lastUpdate && (
                      <p className="text-xs text-green-600 mt-3">
                        最后更新: {new Date(rateInfo.lastUpdate).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-green-700">
                    <p>暂无汇率数据，请点击"手动更新"获取最新汇率</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">
                汇率加成 (%)
                <span className="text-xs text-slate-400 ml-2">在实时汇率基础上增加的百分比</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.exchangeRateMarkup}
                onChange={(e) => setSettings({ ...settings, exchangeRateMarkup: parseFloat(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                placeholder="例如: 5 表示在实时汇率基础上+5%"
              />
            </div>

            {settings.exchangeRateMode === 'manual' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">USDT 汇率 (CNY)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.exchangeRateUSDT}
                    onChange={(e) => setSettings({ ...settings, exchangeRateUSDT: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">TRX 汇率 (CNY)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.exchangeRateTRX}
                    onChange={(e) => setSettings({ ...settings, exchangeRateTRX: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        
  );
}
