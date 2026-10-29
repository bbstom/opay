import { RefreshCw, Plus, EyeOff, Eye, ArrowLeft } from 'lucide-react';

export default function PaymentWalletsTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates,
  wallets, selectedWallet, showAddWallet, newWallet, showPrivateKey, loading,
  handleToggleWalletStatus, handleViewWallet, handleBackToList, handleAddWallet,
  handleDeleteWallet, handleRefreshWallet, setShowAddWallet, setNewWallet, setShowPrivateKey }) {
  return (

          <div className="space-y-6">
            {/* 钱包详情页面 */}
            {selectedWallet ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft size={20} />
                    返回钱包列表
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRefreshWallet(selectedWallet._id || selectedWallet.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      刷新
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 左列 */}
                  <div className="space-y-6">
                    {/* 基本信息 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">基本信息</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">钱包名称:</span>
                          <span className="text-sm font-bold text-slate-900">{selectedWallet.name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-slate-600">地址:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-900 break-all">{selectedWallet.address}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedWallet.address);
                                alert('地址已复制');
                              }}
                              className="text-cyan-600 hover:text-cyan-700 text-xs whitespace-nowrap"
                            >
                              [复制]
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">状态:</span>
                          <span className={`text-sm font-bold ${
                            selectedWallet.health?.status === 'healthy' ? 'text-green-600' :
                            selectedWallet.health?.status === 'warning' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            ● {selectedWallet.health?.status === 'healthy' ? '健康' :
                               selectedWallet.health?.status === 'warning' ? '警告' : '错误'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">优先级:</span>
                          <span className="text-sm font-bold text-slate-900">{selectedWallet.priority || 50}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">创建时间:</span>
                          <span className="text-xs text-slate-900">{new Date(selectedWallet.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* 余额信息 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">余额信息</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">TRX:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900">{(selectedWallet.balance?.trx || 0).toLocaleString()}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              (selectedWallet.balance?.trx || 0) >= (selectedWallet.alerts?.minTrxBalance || 50)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {(selectedWallet.balance?.trx || 0) >= (selectedWallet.alerts?.minTrxBalance || 50) ? '正常' : '不足'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">USDT:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-slate-900">{(selectedWallet.balance?.usdt || 0).toLocaleString()}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              (selectedWallet.balance?.usdt || 0) >= (selectedWallet.alerts?.minUsdtBalance || 100)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {(selectedWallet.balance?.usdt || 0) >= (selectedWallet.alerts?.minUsdtBalance || 100) ? '正常' : '偏低'}
                            </span>
                          </div>
                        </div>
                        {selectedWallet.balance?.lastUpdated && (
                          <div className="pt-2 border-t border-slate-200">
                            <span className="text-xs text-slate-500">
                              最后更新: {new Date(selectedWallet.balance.lastUpdated).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 右列 */}
                  <div className="space-y-6">
                    {/* 资源信息 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">资源信息</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">能量:</span>
                            <span className="text-xs font-bold text-slate-900">
                              {(selectedWallet.resources?.energy?.available || 0).toLocaleString()} / {(selectedWallet.resources?.energy?.limit || 0).toLocaleString()}
                              <span className="text-xs text-slate-500 ml-2">
                                [{(selectedWallet.resources?.energy?.limit || 0) > 0 
                                  ? Math.round((selectedWallet.resources.energy.available / selectedWallet.resources.energy.limit) * 100) 
                                  : 0}%]
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(selectedWallet.resources?.energy?.limit || 0) > 0 
                                  ? Math.round((selectedWallet.resources.energy.available / selectedWallet.resources.energy.limit) * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">带宽:</span>
                            <span className="text-xs font-bold text-slate-900">
                              {(selectedWallet.resources?.bandwidth?.available || 0).toLocaleString()} / {(selectedWallet.resources?.bandwidth?.limit || 0).toLocaleString()}
                              <span className="text-xs text-slate-500 ml-2">
                                [{(selectedWallet.resources?.bandwidth?.limit || 0) > 0 
                                  ? Math.round((selectedWallet.resources.bandwidth.available / selectedWallet.resources.bandwidth.limit) * 100) 
                                  : 0}%]
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(selectedWallet.resources?.bandwidth?.limit || 0) > 0 
                                  ? Math.round((selectedWallet.resources.bandwidth.available / selectedWallet.resources.bandwidth.limit) * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 使用统计 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">使用统计</h3>
                      <div className="space-y-3">
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
                            <span className="text-xs text-slate-500">
                              最后使用: {new Date(selectedWallet.stats.lastUsedAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 - 跨两列 */}
                  <div className="md:col-span-2 flex gap-3">
                    <button
                      onClick={() => handleToggleWalletStatus(selectedWallet._id || selectedWallet.id, selectedWallet.enabled)}
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
                        }
                      }}
                      className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-all"
                    >
                      删除钱包
                    </button>
                  </div>
                </div>
              </div>
            ) : showAddWallet ? (
              /* 添加钱包表单 */
              <div>
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
                >
                  <ArrowLeft size={20} />
                  返回钱包列表
                </button>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-xl font-black text-slate-900 mb-6">添加新钱包</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-600 block mb-2">钱包名称</label>
                      <input
                        type="text"
                        value={newWallet.name}
                        onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                        placeholder="例如: 主钱包"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-600 block mb-2">私钥</label>
                      <div className="relative">
                        <input
                          type={showPrivateKey ? 'text' : 'password'}
                          value={newWallet.privateKey}
                          onChange={(e) => setNewWallet({ ...newWallet, privateKey: e.target.value })}
                          placeholder="输入钱包私钥"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 pr-12 font-mono text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPrivateKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-600 block mb-2">优先级 (1-100)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newWallet.priority}
                        onChange={(e) => setNewWallet({ ...newWallet, priority: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">数值越大优先级越高</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleAddWallet}
                        disabled={loading}
                        className="flex-1 bg-[#0095ff] hover:bg-[#007ad6] text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
                      >
                        {loading ? '添加中...' : '添加钱包'}
                      </button>
                      <button
                        onClick={handleBackToList}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 钱包列表 */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-slate-800">代付钱包</h2>
                  <button
                    onClick={() => setShowAddWallet(true)}
                    className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-cyan-600 transition-all"
                  >
                    <Plus size={18} />
                    添加钱包
                  </button>
                </div>

                {wallets.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <p className="text-slate-500 mb-4">还没有配置钱包</p>
                    <button
                      onClick={() => setShowAddWallet(true)}
                      className="bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-cyan-600 transition-all"
                    >
                      添加第一个钱包
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wallets.map((wallet) => (
                      <div 
                        key={wallet._id} 
                        className="border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-cyan-300 hover:shadow-md transition-all"
                        onClick={() => handleViewWallet(wallet._id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base font-bold text-slate-900">{wallet.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                wallet.status === 'healthy' ? 'bg-green-100 text-green-700' :
                                wallet.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {wallet.status === 'healthy' ? '正常' : wallet.status === 'warning' ? '预警' : '异常'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-mono mb-3 truncate">{wallet.address}</p>
                            
                            <div className="space-y-2 text-sm mb-3">
                              <div className="flex justify-between">
                                <span className="text-slate-500">TRX:</span>
                                <span className="font-bold text-slate-900">{(wallet.balance?.trx || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">USDT:</span>
                                <span className="font-bold text-slate-900">{(wallet.balance?.usdt || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">使用:</span>
                                <span className="font-bold text-slate-900">{wallet.usageCount || 0} 次</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                              <span className="text-xs text-slate-500">优先级: {wallet.priority || 50}</span>
                              <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={wallet.enabled}
                                  onChange={() => handleToggleWalletStatus(wallet._id, wallet.enabled)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/20 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        
  );
}
