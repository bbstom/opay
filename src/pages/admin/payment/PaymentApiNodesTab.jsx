export default function PaymentApiNodesTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates,
  wallets, selectedWallet, showAddWallet, newWallet, showPrivateKey, loading,
  handleToggleWalletStatus, handleViewWallet, handleBackToList, handleAddWallet,
  handleDeleteWallet, handleRefreshWallet, setShowAddWallet, setNewWallet, setShowPrivateKey }) {
  return (

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">链上监控 API 节点配置</h2>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-900">
                <strong>⚠️ 重要：</strong>请至少启用并配置一个 API 节点，否则无法进行链上查询和转账操作。
              </p>
            </div>

            <div className="space-y-4">
              {settings.tronApiNodes && JSON.parse(settings.tronApiNodes || '[]').map((node, index) => {
                const nodes = JSON.parse(settings.tronApiNodes || '[]');
                return (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={node.name}
                          onChange={(e) => {
                            const newNodes = [...nodes];
                            newNodes[index].name = e.target.value;
                            setSettings({ ...settings, tronApiNodes: JSON.stringify(newNodes) });
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
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={node.enabled}
                            onChange={() => {
                              const newNodes = [...nodes];
                              newNodes[index].enabled = !newNodes[index].enabled;
                              setSettings({ ...settings, tronApiNodes: JSON.stringify(newNodes) });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0095ff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0095ff]"></div>
                        </label>
                        {nodes.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`确定要删除节点 "${node.name}" 吗？`)) {
                                const newNodes = nodes.filter((_, i) => i !== index);
                                setSettings({ ...settings, tronApiNodes: JSON.stringify(newNodes) });
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
                            const newNodes = [...nodes];
                            newNodes[index].url = e.target.value;
                            setSettings({ ...settings, tronApiNodes: JSON.stringify(newNodes) });
                          }}
                          placeholder={
                            node.name === 'TronGrid' ? 'https://api.trongrid.io' :
                            'https://api.zan.top/node/v1/tron/mainnet/your_api_key'
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
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
                            const newNodes = [...nodes];
                            newNodes[index].apiKey = e.target.value;
                            setSettings({ ...settings, tronApiNodes: JSON.stringify(newNodes) });
                          }}
                          placeholder="输入 API Key"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-[#0095ff] outline-none"
                          disabled={!node.enabled}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* 添加新节点按钮 */}
              <button
                onClick={() => {
                  const nodes = JSON.parse(settings.tronApiNodes || '[]');
                  nodes.push({
                    name: `自定义节点 ${nodes.length + 1}`,
                    url: '',
                    apiKey: '',
                    enabled: false
                  });
                  setSettings({ ...settings, tronApiNodes: JSON.stringify(nodes) });
                }}
                className="w-full bg-cyan-50 hover:bg-cyan-100 border-2 border-dashed border-cyan-300 rounded-xl px-4 py-3 text-sm font-bold text-cyan-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加新节点
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 mb-2">
                <strong>💡 多节点策略：</strong>
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 系统按顺序尝试连接启用的节点</li>
                <li>• 当前节点失败时自动切换到下一个</li>
                <li>• 建议至少启用 2 个节点以提高可用性</li>
              </ul>
            </div>
          </div>
        
  );
}
