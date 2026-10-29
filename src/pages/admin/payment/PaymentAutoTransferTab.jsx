export default function PaymentAutoTransferTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates,
  wallets, selectedWallet, showAddWallet, newWallet, showPrivateKey, loading,
  handleToggleWalletStatus, handleViewWallet, handleBackToList, handleAddWallet,
  handleDeleteWallet, handleRefreshWallet, setShowAddWallet, setNewWallet, setShowPrivateKey }) {
  return (

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">自动转账配置</h2>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-700">启用自动转账</span>
                <p className="text-xs text-slate-500 mt-1">收到支付后自动执行转账</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.walletAutoTransferEnabled}
                  onChange={(e) => setSettings({ ...settings, walletAutoTransferEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0095ff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0095ff]"></div>
              </label>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">最大重试次数</label>
              <input
                type="number"
                value={settings.walletMaxRetryCount}
                onChange={(e) => setSettings({ ...settings, walletMaxRetryCount: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">转账失败时的最大重试次数</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">TRX 最低余额预警</label>
                <input
                  type="number"
                  value={settings.walletMinTRXBalance}
                  onChange={(e) => setSettings({ ...settings, walletMinTRXBalance: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">USDT 最低余额预警</label>
                <input
                  type="number"
                  value={settings.walletMinUSDTBalance}
                  onChange={(e) => setSettings({ ...settings, walletMinUSDTBalance: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 说明：</strong>当钱包余额低于设定值时，系统会发送预警通知
              </p>
            </div>
          </div>
        
  );
}
