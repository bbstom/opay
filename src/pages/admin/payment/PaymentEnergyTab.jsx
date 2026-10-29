export default function PaymentEnergyTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates,
  wallets, selectedWallet, showAddWallet, newWallet, showPrivateKey, loading,
  handleToggleWalletStatus, handleViewWallet, handleBackToList, handleAddWallet,
  handleDeleteWallet, handleRefreshWallet, setShowAddWallet, setNewWallet, setShowPrivateKey }) {
  return (

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">能量租赁配置</h2>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-700">启用能量租赁</span>
                <p className="text-xs text-slate-500 mt-1">USDT转账时自动租赁能量</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.energyRentalEnabled}
                  onChange={(e) => setSettings({ ...settings, energyRentalEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0095ff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0095ff]"></div>
              </label>
            </div>

            {settings.energyRentalEnabled && (
              <>
                <div key="rental-mode">
                  <label className="text-sm font-bold text-slate-600 block mb-2">租赁模式</label>
                  <select
                    value={settings.energyRentalMode}
                    onChange={(e) => setSettings({ ...settings, energyRentalMode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  >
                    <option value="catfee">CatFee API（推荐）</option>
                    <option value="transfer">转账租赁</option>
                  </select>
                </div>

                {settings.energyRentalMode === 'catfee' ? (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <p className="text-sm text-blue-900 mb-2">
                        💡 <strong>CatFee 能量购买：</strong>通过 API 直接购买能量，无需等待，更加稳定。
                      </p>
                      <p className="text-sm text-blue-800 mb-2">
                        📖 <a href="https://docs.catfee.io/getting-started/buy-energy-via-api-on-catfee/api-overview" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
                          查看 CatFee API 文档
                        </a>
                      </p>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-800 font-bold mb-1">环境说明：</p>
                        <p className="text-xs text-blue-700">
                          • <strong>生产环境：</strong><a href="https://catfee.io" target="_blank" rel="noopener noreferrer" className="underline">catfee.io</a> - API: https://api.catfee.io<br/>
                          • <strong>测试环境：</strong><a href="https://nile.catfee.io" target="_blank" rel="noopener noreferrer" className="underline">nile.catfee.io</a> - API: https://nile.catfee.io<br/>
                          • 两个环境账号和 API Key 不互通，需分别注册
                        </p>
                      </div>
                    </div>

                    <div key="catfee-api-url">
                      <label className="text-sm font-bold text-slate-600 block mb-2">
                        CatFee API 环境
                      </label>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, catfeeApiUrl: 'https://api.catfee.io' })}
                          className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                            settings.catfeeApiUrl === 'https://api.catfee.io'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          🌐 生产环境
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, catfeeApiUrl: 'https://nile.catfee.io' })}
                          className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                            settings.catfeeApiUrl === 'https://nile.catfee.io'
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          🧪 测试环境 (Nile)
                        </button>
                      </div>
                      <input
                        type="text"
                        value={settings.catfeeApiUrl || 'https://api.catfee.io'}
                        onChange={(e) => setSettings({ ...settings, catfeeApiUrl: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                        placeholder="https://api.catfee.io"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {settings.catfeeApiUrl === 'https://api.catfee.io' && '✅ 当前：生产环境 - 使用真实 TRX 购买能量'}
                        {settings.catfeeApiUrl === 'https://nile.catfee.io' && '⚠️ 当前：测试环境 - 使用测试币，适合开发调试'}
                        {settings.catfeeApiUrl !== 'https://api.catfee.io' && settings.catfeeApiUrl !== 'https://nile.catfee.io' && '自定义 API 地址'}
                      </p>
                    </div>

                    <div key="catfee-api-credentials" className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-900 mb-2">
                          🔑 <strong>获取 API 凭证：</strong>
                        </p>
                        <ol className="text-xs text-amber-800 space-y-1 ml-4 list-decimal">
                          <li>登录 CatFee 后台（{settings.catfeeApiUrl === 'https://nile.catfee.io' ? '测试环境' : '生产环境'}）</li>
                          <li>进入【个人中心】→【API】→【API 配置】</li>
                          <li>复制 <strong>API Key</strong> 和 <strong>API Secret</strong> 两个值</li>
                          <li>分别粘贴到下方输入框</li>
                        </ol>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-600 block mb-2">
                          API Key <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={settings.catfeeApiKey?.split(':')[0] || ''}
                          onChange={(e) => {
                            const secret = settings.catfeeApiKey?.split(':')[1] || '';
                            const newValue = secret ? `${e.target.value}:${secret}` : e.target.value;
                            setSettings({ ...settings, catfeeApiKey: newValue });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                          placeholder="例如: 40e7c486-c18e-40d4-9502-35423dcdb70e"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          在 CatFee 后台【API 配置】页面复制 API Key
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-600 block mb-2">
                          API Secret <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={settings.catfeeApiKey?.split(':')[1] || ''}
                          onChange={(e) => {
                            const key = settings.catfeeApiKey?.split(':')[0] || '';
                            const newValue = key ? `${key}:${e.target.value}` : `:${e.target.value}`;
                            setSettings({ ...settings, catfeeApiKey: newValue });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                          placeholder="例如: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          在 CatFee 后台【API 配置】页面复制 API Secret
                        </p>
                      </div>

                      {settings.catfeeApiKey && settings.catfeeApiKey.includes(':') && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <p className="text-xs text-green-800">
                            ✅ API 凭证已配置完整
                          </p>
                        </div>
                      )}
                      
                      {settings.catfeeApiKey && !settings.catfeeApiKey.includes(':') && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <p className="text-xs text-red-800">
                            ⚠️ 请同时配置 API Key 和 API Secret
                          </p>
                        </div>
                      )}
                    </div>

                    <div key="catfee-energy" className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-slate-600 block mb-2">首次转账能量</label>
                        <input
                          type="number"
                          value={settings.catfeeEnergyFirst}
                          onChange={(e) => setSettings({ ...settings, catfeeEnergyFirst: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-600 block mb-2">正常转账能量</label>
                        <input
                          type="number"
                          value={settings.catfeeEnergyNormal}
                          onChange={(e) => setSettings({ ...settings, catfeeEnergyNormal: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div key="rental-address">
                      <label className="text-sm font-bold text-slate-600 block mb-2">能量租赁服务商地址</label>
                      <input
                        type="text"
                        value={settings.energyRentalAddress || ''}
                        onChange={(e) => setSettings({ ...settings, energyRentalAddress: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                      />
                    </div>

                    <div key="rental-amounts" className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-slate-600 block mb-2">首次转账金额 (TRX)</label>
                        <input
                          type="number"
                          value={settings.energyRentalAmountFirst}
                          onChange={(e) => setSettings({ ...settings, energyRentalAmountFirst: parseFloat(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-600 block mb-2">正常转账金额 (TRX)</label>
                        <input
                          type="number"
                          value={settings.energyRentalAmountNormal}
                          onChange={(e) => setSettings({ ...settings, energyRentalAmountNormal: parseFloat(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        
  );
}
