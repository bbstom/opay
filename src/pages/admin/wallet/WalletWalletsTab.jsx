import { Wallet, Key, Shield, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff, Lock, DollarSign, Zap, Wifi, Battery, Plus, Trash2 } from 'lucide-react';

export default function WalletWalletsTab({ config, setConfig, privateKey, setPrivateKey, showPrivateKey, setShowPrivateKey,
  loading, testing, validating, testResult, validationResult, handleValidateKey, handleSave, handleTest,
  wallets, walletsLoading, showAddWallet, setShowAddWallet, selectedWallet, setSelectedWallet,
  newWallet, setNewWallet, handleAddWallet, handleDeleteWallet, handleToggleWallet, handleRefreshWallet,
  handleRefreshAllWallets, handleViewWallet, handleBackToList, currentSubTab, setSearchParams }) {
  return (

          <>
            {/* 钱包详情页面 */}
            {selectedWallet ? (
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToList}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{selectedWallet.name}</h2>
                      <p className="text-xs text-slate-500">钱包详情</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRefreshWallet(selectedWallet._id || selectedWallet.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                    >
                      <RefreshCw size={16} />
                      刷新
                    </button>
                  </div>
                </div>

                {/* 基本信息 */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">基本信息</h3>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">钱包地址</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-900">{selectedWallet.address}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedWallet.address);
                            alert('地址已复制');
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-600"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">状态</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          selectedWallet.health?.status === 'healthy' ? 'bg-green-100 text-green-700' :
                          selectedWallet.health?.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedWallet.health?.status === 'healthy' ? '● 健康' :
                           selectedWallet.health?.status === 'warning' ? '● 警告' : '● 错误'}
                        </span>
                        {selectedWallet.enabled ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">启用</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded">禁用</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">优先级</span>
                      <span className="text-sm font-bold text-slate-900">{selectedWallet.priority}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">创建时间</span>
                      <span className="text-xs text-slate-900">{new Date(selectedWallet.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                </div>

                {/* 余额信息 */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">余额信息</h3>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">TRX:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">{(selectedWallet.balance?.trx || 0).toFixed(2)}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          (selectedWallet.balance?.trx || 0) < (selectedWallet.alerts?.minTrxBalance || 50)
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {(selectedWallet.balance?.trx || 0) < (selectedWallet.alerts?.minTrxBalance || 50) ? '不足' : '正常'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">USDT:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">{(selectedWallet.balance?.usdt || 0).toFixed(2)}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          (selectedWallet.balance?.usdt || 0) < (selectedWallet.alerts?.minUsdtBalance || 100)
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {(selectedWallet.balance?.usdt || 0) < (selectedWallet.alerts?.minUsdtBalance || 100) ? '偏低' : '正常'}
                        </span>
                      </div>
                    </div>
                    {selectedWallet.balance?.lastUpdated && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          最后更新: {new Date(selectedWallet.balance.lastUpdated).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 使用统计 */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">使用统计</h3>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">总交易:</span>
                      <span className="text-sm font-bold text-slate-900">{selectedWallet.stats?.totalTransactions || 0} 笔</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">成功:</span>
                      <span className="text-sm font-bold text-green-600">{selectedWallet.stats?.successCount || 0} 笔</span>
                      <span className="text-sm text-slate-400">|</span>
                      <span className="text-sm text-slate-600">失败:</span>
                      <span className="text-sm font-bold text-red-600">{selectedWallet.stats?.failCount || 0} 笔</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">成功率:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {(selectedWallet.stats?.totalTransactions || 0) > 0 
                          ? (((selectedWallet.stats?.successCount || 0) / selectedWallet.stats.totalTransactions) * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                    {selectedWallet.stats?.lastUsedAt && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          最后使用: {new Date(selectedWallet.stats.lastUsedAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 资源信息 */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">资源信息</h3>
                  <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">能量</span>
                        <span className="text-xs font-bold text-slate-900">
                          {(selectedWallet.resources?.energy?.available || 0).toLocaleString()} / {(selectedWallet.resources?.energy?.limit || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className="bg-orange-500 h-1.5 rounded-full transition-all"
                          style={{ 
                            width: `${(selectedWallet.resources?.energy?.limit || 0) > 0 ? ((selectedWallet.resources.energy.available / selectedWallet.resources.energy.limit) * 100) : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">带宽</span>
                        <span className="text-xs font-bold text-slate-900">
                          {(selectedWallet.resources?.bandwidth?.available || 0).toLocaleString()} / {(selectedWallet.resources?.bandwidth?.limit || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full transition-all"
                          style={{ 
                            width: `${(selectedWallet.resources?.bandwidth?.limit || 0) > 0 ? ((selectedWallet.resources.bandwidth.available / selectedWallet.resources.bandwidth.limit) * 100) : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleWallet(selectedWallet._id || selectedWallet.id, selectedWallet.enabled)}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      selectedWallet.enabled 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {selectedWallet.enabled ? '禁用钱包' : '启用钱包'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定要删除钱包"${selectedWallet.name}"吗？此操作不可恢复！`)) {
                        handleDeleteWallet(selectedWallet._id || selectedWallet.id, selectedWallet.name);
                        handleBackToList();
                      }
                    }}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-all"
                  >
                    删除钱包
                  </button>
                </div>
              </div>
            ) : (
              /* 钱包列表 */
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Wallet className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">钱包管理</h2>
                    <p className="text-xs text-slate-500">管理多个钱包，智能分配转账任务</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRefreshAllWallets}
                    disabled={walletsLoading}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={walletsLoading ? 'animate-spin' : ''} />
                    刷新全部
                  </button>
                  <button
                    onClick={() => setShowAddWallet(true)}
                    className="px-4 py-2 bg-[#0095ff] hover:bg-[#007ad6] text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <Plus size={16} />
                    添加钱包
                  </button>
                </div>
              </div>

              {walletsLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="animate-spin mx-auto mb-4 text-slate-400" size={32} />
                  <p className="text-slate-500">加载中...</p>
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">还没有钱包</h3>
                  <p className="text-slate-500 mb-6">添加第一个钱包开始使用多钱包系统</p>
                  <button
                    onClick={() => setShowAddWallet(true)}
                    className="px-6 py-3 bg-[#0095ff] hover:bg-[#007ad6] text-white rounded-lg font-bold transition-all"
                  >
                    添加钱包
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {wallets.map((wallet) => (
                    <div 
                      key={wallet._id || wallet.id} 
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        wallet.enabled ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md' : 'border-slate-300 bg-slate-50 opacity-75'
                      }`}
                      onClick={() => handleViewWallet(wallet._id || wallet.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-black text-slate-900">{wallet.name}</h3>
                            {wallet.enabled ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">启用</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded">禁用</span>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                              wallet.health?.status === 'healthy' ? 'bg-green-100 text-green-700' :
                              wallet.health?.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {wallet.health?.status === 'healthy' ? '健康' :
                               wallet.health?.status === 'warning' ? '警告' : '错误'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-600">{wallet.address}</p>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRefreshWallet(wallet._id || wallet.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            title="刷新状态"
                          >
                            <RefreshCw size={16} className="text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleToggleWallet(wallet._id || wallet.id, wallet.enabled)}
                            className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                              wallet.enabled 
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                                : 'bg-green-100 hover:bg-green-200 text-green-700'
                            }`}
                            title={wallet.enabled ? '禁用钱包' : '启用钱包'}
                          >
                            {wallet.enabled ? '禁用' : '启用'}
                          </button>
                          <button
                            onClick={() => handleDeleteWallet(wallet._id || wallet.id, wallet.name)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-all"
                            title="删除"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">优先级</p>
                          <p className="text-lg font-black text-slate-900">{wallet.priority || 50}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">TRX 余额</p>
                          <p className="text-lg font-black text-slate-900">{(wallet.balance?.trx || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">USDT 余额</p>
                          <p className="text-lg font-black text-slate-900">{(wallet.balance?.usdt || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">交易次数</p>
                          <p className="text-lg font-black text-slate-900">{wallet.stats?.totalTransactions || 0}</p>
                        </div>
                      </div>

                      {(wallet.stats?.totalTransactions || 0) > 0 && (
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>成功: {wallet.stats?.successCount || 0}</span>
                          <span>失败: {wallet.stats?.failCount || 0}</span>
                          <span>成功率: {(wallet.stats?.totalTransactions || 0) > 0 ? (((wallet.stats?.successCount || 0) / wallet.stats.totalTransactions) * 100).toFixed(1) : 0}%</span>
                          {wallet.stats?.lastUsedAt && (
                            <span>最后使用: {new Date(wallet.stats.lastUsedAt).toLocaleString('zh-CN')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* 添加钱包对话框 */}
            {showAddWallet && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-black text-slate-900 mb-4">添加钱包</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">钱包名称</label>
                      <input
                        type="text"
                        value={newWallet.name}
                        onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                        placeholder="例如：主钱包、备用钱包"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">私钥</label>
                      <input
                        type="password"
                        value={newWallet.privateKey}
                        onChange={(e) => setNewWallet({ ...newWallet, privateKey: e.target.value })}
                        placeholder="64位十六进制私钥"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">私钥将使用 AES-256-GCM 加密存储</p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-2">优先级（1-100）</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newWallet.priority}
                        onChange={(e) => setNewWallet({ ...newWallet, priority: parseInt(e.target.value) || 50 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">数值越高优先级越高，建议 50-100</p>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-3">预警设置</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">TRX 最低余额</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="10"
                              value={newWallet.alerts.minTrxBalance}
                              onChange={(e) => setNewWallet({
                                ...newWallet,
                                alerts: { ...newWallet.alerts, minTrxBalance: parseInt(e.target.value) || 50 }
                              })}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                            />
                            <span className="text-xs text-slate-600">TRX</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">USDT 最低余额</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="10"
                              value={newWallet.alerts.minUsdtBalance}
                              onChange={(e) => setNewWallet({
                                ...newWallet,
                                alerts: { ...newWallet.alerts, minUsdtBalance: parseInt(e.target.value) || 100 }
                              })}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                            />
                            <span className="text-xs text-slate-600">USDT</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">最低能量</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="10000"
                              value={newWallet.alerts.minEnergy}
                              onChange={(e) => setNewWallet({
                                ...newWallet,
                                alerts: { ...newWallet.alerts, minEnergy: parseInt(e.target.value) || 50000 }
                              })}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                            />
                            <span className="text-xs text-slate-600">能量</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <label className="text-xs font-medium text-slate-700">启用余额预警</label>
                          <button
                            onClick={() => setNewWallet({
                              ...newWallet,
                              alerts: { ...newWallet.alerts, enabled: !newWallet.alerts.enabled }
                            })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              newWallet.alerts.enabled ? 'bg-[#0095ff]' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                              newWallet.alerts.enabled ? 'translate-x-6' : ''
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddWallet(false);
                        setNewWallet({
                          name: '',
                          privateKey: '',
                          priority: 50,
                          alerts: {
                            minTrxBalance: 50,
                            minUsdtBalance: 100,
                            minEnergy: 50000,
                            enabled: true
                          }
                        });
                      }}
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-all"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddWallet}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-[#0095ff] hover:bg-[#007ad6] text-white rounded-lg font-bold transition-all disabled:opacity-50"
                    >
                      {loading ? '添加中...' : '添加'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        
  );
}
