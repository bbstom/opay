import { Wallet, Key, Shield, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff, Lock, DollarSign, Zap, Wifi, Battery, Plus, Trash2 } from 'lucide-react';

export default function WalletBasicTab({ config, setConfig, privateKey, setPrivateKey, showPrivateKey, setShowPrivateKey,
  loading, testing, validating, testResult, validationResult, handleValidateKey, handleSave, handleTest,
  wallets, walletsLoading, showAddWallet, setShowAddWallet, selectedWallet, setSelectedWallet,
  newWallet, setNewWallet, handleAddWallet, handleDeleteWallet, handleToggleWallet, handleRefreshWallet,
  handleRefreshAllWallets, handleViewWallet, handleBackToList, currentSubTab, setSearchParams }) {
  return (

          <>
            {/* 子标签导航 */}
            <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setSearchParams({ tab: 'basic', subtab: 'api' })}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                    currentSubTab === 'api'
                      ? 'bg-[#0095ff] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  监控API配置
                </button>
                <button
                  onClick={() => setSearchParams({ tab: 'basic', subtab: 'wallet' })}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                    currentSubTab === 'wallet'
                      ? 'bg-[#0095ff] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  钱包地址
                </button>
                <button
                  onClick={() => setSearchParams({ tab: 'basic', subtab: 'transfer' })}
                  className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                    currentSubTab === 'transfer'
                      ? 'bg-[#0095ff] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  自动转账
                </button>
              </div>
            </div>

            {/* 监控API配置子标签 */}
            {currentSubTab === 'api' && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                <h2 className="text-xl font-black text-slate-900 mb-6">链上监控 API 节点配置</h2>

                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-900">
                    <strong>⚠️ 重要：</strong>请至少启用并配置一个 API 节点，否则无法进行链上查询和转账操作。
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {config.tronApiNodes && config.tronApiNodes.map((node, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={node.name}
                            onChange={(e) => {
                              const newNodes = [...config.tronApiNodes];
                              newNodes[index].name = e.target.value;
                              setConfig({ ...config, tronApiNodes: newNodes });
                            }}
                            className="text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none px-1 py-0.5"
                            placeholder="节点名称"
                          />
                          {node.name === 'TronGrid' && (
                            <a 
                              href="https://www.trongrid.io/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 underline"
                            >
                              获取 API Key →
                            </a>
                          )}
                          {node.name === 'ZAN' && (
                            <a 
                              href="https://zan.top/cn" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 underline"
                            >
                              获取 API Key →
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newNodes = [...config.tronApiNodes];
                              newNodes[index].enabled = !newNodes[index].enabled;
                              setConfig({ ...config, tronApiNodes: newNodes });
                            }}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              node.enabled ? 'bg-[#0095ff]' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                              node.enabled ? 'translate-x-6' : ''
                            }`} />
                          </button>
                          {config.tronApiNodes.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`确定要删除节点 "${node.name}" 吗？`)) {
                                  const newNodes = config.tronApiNodes.filter((_, i) => i !== index);
                                  setConfig({ ...config, tronApiNodes: newNodes });
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="删除节点"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">API URL</label>
                          <input
                            type="text"
                            value={node.url}
                            onChange={(e) => {
                              const newNodes = [...config.tronApiNodes];
                              newNodes[index].url = e.target.value;
                              setConfig({ ...config, tronApiNodes: newNodes });
                            }}
                            placeholder={
                              node.name === 'TronGrid' ? 'https://api.trongrid.io' :
                              'https://api.zan.top/node/v1/tron/mainnet/your_api_key'
                            }
                            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                            disabled={!node.enabled}
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">
                            API Key <span className="text-slate-400">(可选)</span>
                          </label>
                          <input
                            type="text"
                            value={node.apiKey}
                            onChange={(e) => {
                              const newNodes = [...config.tronApiNodes];
                              newNodes[index].apiKey = e.target.value;
                              setConfig({ ...config, tronApiNodes: newNodes });
                            }}
                            placeholder="输入 API Key"
                            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                            disabled={!node.enabled}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 添加新节点按钮 */}
                  <button
                    onClick={() => {
                      const newNodes = [...config.tronApiNodes];
                      newNodes.push({
                        name: `自定义节点 ${newNodes.length + 1}`,
                        url: '',
                        apiKey: '',
                        enabled: false
                      });
                      setConfig({ ...config, tronApiNodes: newNodes });
                    }}
                    className="w-full bg-cyan-50 hover:bg-cyan-100 border-2 border-dashed border-cyan-300 rounded-lg px-4 py-3 text-sm font-bold text-cyan-600 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加新节点
                  </button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <p className="text-xs text-blue-900 mb-1">
                    <strong>💡 多节点策略：</strong>
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 系统按顺序尝试连接启用的节点</li>
                    <li>• 当前节点失败时自动切换到下一个</li>
                    <li>• 建议至少启用 2 个节点以提高可用性</li>
                    <li>• 所有查询使用当前连接的节点</li>
                  </ul>
                </div>

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
              </div>
            )}

            {/* 钱包地址子标签 */}
            {currentSubTab === 'wallet' && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                <h2 className="text-xl font-black text-slate-900 mb-6">默认钱包配置</h2>
                
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    💡 <strong>说明：</strong>此处配置的是系统默认钱包，用于基础操作和监控。如需使用多钱包智能分配功能，请前往"钱包管理"标签添加多个钱包。
                  </p>
                </div>

                {config.tronWalletAddress && (
                  <div className="mb-6">
                    <label className="text-sm font-bold text-slate-700 block mb-2">当前钱包地址</label>
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="text-sm font-mono text-green-900">{config.tronWalletAddress}</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="text-sm font-bold text-slate-700 block mb-2 flex items-center gap-2">
                    <Lock size={16} />
                    钱包私钥 {config.hasPrivateKey && <span className="text-green-600 text-xs">(已配置)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={privateKey}
                      onChange={(e) => {
                        setPrivateKey(e.target.value);
                        setValidationResult(null);
                      }}
                      placeholder={config.hasPrivateKey ? '留空表示不修改私钥' : '输入64位十六进制私钥'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 pr-24 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPrivateKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">私钥将使用 AES-256-GCM 加密后存储，只有服务器可以解密</p>

                  {privateKey && (
                    <button
                      onClick={handleValidateKey}
                      disabled={validating}
                      className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {validating ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          验证中...
                        </>
                      ) : (
                        <>
                          <Key size={16} />
                          验证私钥
                        </>
                      )}
                    </button>
                  )}

                  {validationResult && (
                    <div className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${
                      validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      {validationResult.valid ? (
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                      ) : (
                        <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${validationResult.valid ? 'text-green-900' : 'text-red-900'}`}>
                          {validationResult.message}
                        </p>
                        {validationResult.walletAddress && (
                          <p className="text-xs font-mono text-green-700 mt-1">钱包地址: {validationResult.walletAddress}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mb-6">
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

                  <button
                    onClick={handleTest}
                    disabled={testing || !config.hasPrivateKey}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {testing ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        测试连接
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div className={`mb-6 p-4 rounded-xl border ${
                    testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {testResult.success ? (
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      ) : (
                        <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-bold mb-2 ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                          {testResult.message || (testResult.success ? '连接成功' : '连接失败')}
                        </p>
                        {testResult.success && (
                          <div className="text-xs text-green-800 space-y-1">
                            <p>钱包地址: {testResult.address}</p>
                            <p>TRX 余额: {testResult.trxBalance?.toFixed(6)} TRX</p>
                            <p>USDT 余额: {testResult.usdtBalance?.toFixed(6)} USDT</p>
                          </div>
                        )}
                        {!testResult.success && testResult.error && (
                          <p className="text-xs text-red-700 mt-1">{testResult.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-amber-900 mb-1">安全提示</p>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• 私钥使用 AES-256-GCM 加密存储，只有服务器可以解密</li>
                      <li>• 私钥不会在前端显示或传输到浏览器</li>
                      <li>• 建议使用专用钱包，不要与个人资产混用</li>
                      <li>• 定期备份私钥到安全的离线位置</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 自动转账子标签 */}
            {currentSubTab === 'transfer' && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                <h2 className="text-xl font-black text-slate-900 mb-6">自动转账配置</h2>

                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">启用自动转账</label>
                    <p className="text-xs text-slate-500">支付完成后自动执行区块链转账</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, walletAutoTransferEnabled: !config.walletAutoTransferEnabled })}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      config.walletAutoTransferEnabled ? 'bg-[#0095ff]' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      config.walletAutoTransferEnabled ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold text-slate-700 block mb-2">最大重试次数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.walletMaxRetryCount}
                    onChange={(e) => setConfig({ ...config, walletMaxRetryCount: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">转账失败时自动重试的次数（建议 3 次）</p>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold text-slate-700 block mb-2">TRX 最低余额预警</label>
                  <input
                    type="number"
                    min="10"
                    value={config.walletMinTRXBalance}
                    onChange={(e) => setConfig({ ...config, walletMinTRXBalance: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">TRX 余额低于此值时显示预警（建议 50 TRX）</p>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold text-slate-700 block mb-2">USDT 最低余额预警</label>
                  <input
                    type="number"
                    min="10"
                    value={config.walletMinUSDTBalance}
                    onChange={(e) => setConfig({ ...config, walletMinUSDTBalance: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">USDT 余额低于此值时显示预警（建议 100 USDT）</p>
                </div>

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
              </div>
            )}
          </>
        
  );
}
