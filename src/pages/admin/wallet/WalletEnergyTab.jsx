import { Wallet, Key, Shield, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff, Lock, DollarSign, Zap, Wifi, Battery, Plus, Trash2 } from 'lucide-react';

export default function WalletEnergyTab({ config, setConfig, privateKey, setPrivateKey, showPrivateKey, setShowPrivateKey,
  loading, testing, validating, testResult, validationResult, handleValidateKey, handleSave, handleTest,
  wallets, walletsLoading, showAddWallet, setShowAddWallet, selectedWallet, setSelectedWallet,
  newWallet, setNewWallet, handleAddWallet, handleDeleteWallet, handleToggleWallet, handleRefreshWallet,
  handleRefreshAllWallets, handleViewWallet, handleBackToList, currentSubTab, setSearchParams }) {
  return (

          <>
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="text-orange-600" size={20} />
                <h2 className="text-xl font-black text-slate-900">能量租赁配置</h2>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 mb-2">
                  💡 <strong>按需租赁策略：</strong>系统只在实际转账时检查能量，如果不足才自动租赁。
                  无需提前储备能量，即使能量为 0 也没关系。
                </p>
                <p className="text-sm text-blue-900 mb-2">
                  🎯 <strong>智能判断：</strong>系统会自动检测目标地址是否首次接收 USDT：
                </p>
                <ul className="text-sm text-blue-800 ml-4 space-y-1 mb-2">
                  <li>• 首次转账（激活账户）：需要约 131,000 能量，租赁 20 TRX</li>
                  <li>• 后续转账（已有 USDT）：需要约 65,000 能量，租赁 10 TRX</li>
                  <li>• 一次租赁（20 TRX）获得约 200,000 能量，足够多笔转账</li>
                </ul>
                <p className="text-sm text-blue-900">
                  ⚙️ <strong>适用范围：</strong>此配置对所有钱包（包括默认钱包和多钱包系统中的所有钱包）生效。
                </p>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">启用能量租赁</label>
                  <p className="text-xs text-slate-500">能量不足时自动租赁</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, energyRentalEnabled: !config.energyRentalEnabled })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    config.energyRentalEnabled ? 'bg-[#0095ff]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    config.energyRentalEnabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>

              {config.energyRentalEnabled ? (
                <>
                  <div className="mb-6">
                    <label className="text-sm font-bold text-slate-700 block mb-2">租赁模式</label>
                    <select
                      value={config.energyRentalMode}
                      onChange={(e) => setConfig({ ...config, energyRentalMode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    >
                      <option value="transfer">转账租赁（向指定地址转账）</option>
                      <option value="catfee">API 购买（CatFee 平台）</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {config.energyRentalMode === 'transfer' 
                        ? '向能量服务商地址转账 TRX 来租赁能量' 
                        : '通过 CatFee API 直接购买能量，更快更稳定'}
                    </p>
                  </div>

                  {config.energyRentalMode === 'transfer' && (
                    <>
                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">租赁服务商地址</label>
                        <input
                          type="text"
                          value={config.energyRentalAddress}
                          onChange={(e) => setConfig({ ...config, energyRentalAddress: e.target.value })}
                          placeholder="输入能量租赁服务商的 TRON 地址"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">向此地址发送 TRX 后会收到能量</p>
                      </div>

                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">首次转账租赁金额（TRX）</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.energyRentalAmountFirst}
                          onChange={(e) => setConfig({ ...config, energyRentalAmountFirst: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">目标地址无 USDT 时的租赁金额（需要约 131,000 能量，建议 20 TRX）</p>
                      </div>

                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">正常转账租赁金额（TRX）</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.energyRentalAmountNormal}
                          onChange={(e) => setConfig({ ...config, energyRentalAmountNormal: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">目标地址有 USDT 时的租赁金额（需要约 65,000 能量，建议 10 TRX）</p>
                      </div>

                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">等待时间（秒）</label>
                        <input
                          type="number"
                          min="10"
                          max="120"
                          value={config.energyRentalWaitTime}
                          onChange={(e) => setConfig({ ...config, energyRentalWaitTime: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">等待能量到账的时间（建议 30 秒）</p>
                      </div>
                    </>
                  )}

                  {config.energyRentalMode === 'catfee' && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-900 mb-2">
                          💡 <strong>CatFee 能量购买：</strong>通过 API 直接购买能量，无需等待，更加稳定。
                        </p>
                        <p className="text-sm text-blue-800 mb-2">
                          📖 <a href="https://docs.catfee.io/getting-started/buy-energy-via-api-on-catfee/api-overview" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
                            查看 CatFee API 文档
                          </a> 获取 API Key 和 Secret
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

                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">
                          CatFee API 环境
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <button
                            type="button"
                            onClick={() => setConfig({ ...config, catfeeApiUrl: 'https://api.catfee.io' })}
                            className={`px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                              config.catfeeApiUrl === 'https://api.catfee.io'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            🌐 生产环境
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfig({ ...config, catfeeApiUrl: 'https://nile.catfee.io' })}
                            className={`px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                              config.catfeeApiUrl === 'https://nile.catfee.io'
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            🧪 测试环境 (Nile)
                          </button>
                        </div>
                        <input
                          type="text"
                          value={config.catfeeApiUrl}
                          onChange={(e) => setConfig({ ...config, catfeeApiUrl: e.target.value })}
                          placeholder="https://api.catfee.io"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {config.catfeeApiUrl === 'https://api.catfee.io' && '✅ 当前：生产环境 - 使用真实 TRX 购买能量'}
                          {config.catfeeApiUrl === 'https://nile.catfee.io' && '⚠️ 当前：测试环境 - 使用测试币，适合开发调试'}
                          {config.catfeeApiUrl !== 'https://api.catfee.io' && config.catfeeApiUrl !== 'https://nile.catfee.io' && '自定义 API 地址'}
                        </p>
                      </div>

                      <div className="mb-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-sm text-amber-900 mb-2">
                            🔑 <strong>获取 API 凭证：</strong>
                          </p>
                          <ol className="text-xs text-amber-800 space-y-1 ml-4 list-decimal">
                            <li>登录 CatFee 后台（{config.catfeeApiUrl === 'https://nile.catfee.io' ? '测试环境' : '生产环境'}）</li>
                            <li>进入【个人中心】→【API】→【API 配置】</li>
                            <li>复制 <strong>API Key</strong> 和 <strong>API Secret</strong> 两个值</li>
                            <li>分别粘贴到下方输入框</li>
                          </ol>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-slate-700 block mb-2">
                            API Key <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={config.catfeeApiKey?.split(':')[0] || ''}
                            onChange={(e) => {
                              const secret = config.catfeeApiKey?.split(':')[1] || '';
                              const newValue = secret ? `${e.target.value}:${secret}` : e.target.value;
                              setConfig({ ...config, catfeeApiKey: newValue });
                            }}
                            placeholder="例如: 40e7c486-c18e-40d4-9502-35423dcdb70e"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            在 CatFee 后台【API 配置】页面复制 API Key
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-bold text-slate-700 block mb-2">
                            API Secret <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={config.catfeeApiKey?.split(':')[1] || ''}
                            onChange={(e) => {
                              const key = config.catfeeApiKey?.split(':')[0] || '';
                              const newValue = key ? `${key}:${e.target.value}` : `:${e.target.value}`;
                              setConfig({ ...config, catfeeApiKey: newValue });
                            }}
                            placeholder="例如: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            在 CatFee 后台【API 配置】页面复制 API Secret
                          </p>
                        </div>

                        {config.catfeeApiKey && config.catfeeApiKey.includes(':') && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-800">
                              ✅ API 凭证已配置完整
                            </p>
                          </div>
                        )}
                        
                        {config.catfeeApiKey && !config.catfeeApiKey.includes(':') && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs text-red-800">
                              ⚠️ 请同时配置 API Key 和 API Secret
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">首次转账能量（Energy）</label>
                        <input
                          type="number"
                          min="10000"
                          step="1000"
                          value={config.catfeeEnergyFirst}
                          onChange={(e) => setConfig({ ...config, catfeeEnergyFirst: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          目标地址无 USDT 时购买的能量（建议 131000）
                        </p>
                      </div>

                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">正常转账能量（Energy）</label>
                        <input
                          type="number"
                          min="10000"
                          step="1000"
                          value={config.catfeeEnergyNormal}
                          onChange={(e) => setConfig({ ...config, catfeeEnergyNormal: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          目标地址有 USDT 时购买的能量（建议 65000）
                        </p>
                      </div>

                      <div className="mb-6">
                        <label className="text-sm font-bold text-slate-700 block mb-2">租赁时长</label>
                        <select
                          value={config.catfeePeriod}
                          onChange={(e) => setConfig({ ...config, catfeePeriod: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0095ff] outline-none"
                        >
                          <option value="1">1 小时</option>
                          <option value="3">3 小时</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                          能量的有效期，建议选择 1 小时
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-[#0095ff] hover:bg-[#007ad6] text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存配置'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="text-slate-400" size={32} />
                  </div>
                  <p className="text-slate-500 mb-4">能量租赁功能未启用</p>
                  <p className="text-sm text-slate-400">
                    启用后，系统会在能量不足时自动租赁能量，节省转账成本
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-lg font-black text-slate-900 mb-4">资源管理说明</h3>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="text-orange-600" size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">能量租赁（按需）</p>
                    <p>只在转账时检查能量，不足才租赁。无需提前储备，避免浪费。</p>
                    <p className="text-xs text-slate-500 mt-1">成本：约 1.4 TRX/笔，一次租赁支持 6-7 笔转账</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Battery className="text-indigo-600" size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">质押 TRX</p>
                    <p>在钱包中质押 TRX 获取能量和带宽。适合高频转账场景。</p>
                    <p className="text-xs text-slate-500 mt-1">成本：几乎为 0（质押可随时解除）</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wifi className="text-purple-600" size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">免费带宽</p>
                    <p>每个账户每天有 1,500 免费带宽，足够 4-5 笔转账。</p>
                    <p className="text-xs text-slate-500 mt-1">成本：完全免费</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        
  );
}
