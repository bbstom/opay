export default function TelegramBroadcastStatsTab({ templates, setTemplates, broadcasts, setBroadcasts, groups, setGroups, stats, setStats,
  menu, setMenu, systemActions, setSystemActions, contents, setContents, editingContent, setEditingContent,
  showContentEditor, setShowContentEditor, loading, setLoading, selectedCategory, setSelectedCategory,
  templateForm, setTemplateForm, broadcastForm, setBroadcastForm, showTemplateModal, setShowTemplateModal,
  showBroadcastModal, setShowBroadcastModal, editingTemplate, setEditingTemplate, editingBroadcast, setEditingBroadcast,
  saveTemplate, deleteTemplate, createBroadcast, sendBroadcast, editBroadcast, updateBroadcast, deleteBroadcast,
  stopRepeat, triggerBroadcast, viewDetails, duplicateBroadcast, saveBroadcast, addButton, updateButton, removeButton,
  resetTemplateForm, resetBroadcastForm, editTemplate, saveMenu, resetMenu, addMenuButton, updateMenuButton,
  removeMenuButton, moveMenuButton, fetchData }) {
  return (

          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">群发统计</h2>
              <p className="text-slate-600">查看所有群发消息的详细统计信息</p>
            </div>

            {/* 总体统计 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="text-slate-600 mb-2">总群发数</div>
                <div className="text-xl font-bold text-slate-900">{broadcasts.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="text-slate-600 mb-2">草稿</div>
                <div className="text-xl font-bold text-slate-600">
                  {broadcasts.filter(b => b.status === 'draft').length}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="text-slate-600 mb-2">已完成</div>
                <div className="text-xl font-bold text-green-600">
                  {broadcasts.filter(b => b.status === 'completed').length}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="text-slate-600 mb-2">重复发送中</div>
                <div className="text-xl font-bold text-orange-600">
                  {broadcasts.filter(b => b.repeatEnabled && b.status === 'completed').length}
                </div>
              </div>
            </div>

            {/* 详细列表 */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold">群发详情</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">标题</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">目标</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">总数</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">成功</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">失败</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">成功率</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">重复</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">下次发送</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {broadcasts.map(broadcast => {
                      const successRate = broadcast.totalUsers > 0 
                        ? ((broadcast.sentCount / broadcast.totalUsers) * 100).toFixed(1)
                        : '0.0';
                      
                      return (
                        <tr key={broadcast._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">{broadcast.title}</div>
                            <div className="text-xs text-slate-500">
                              {broadcast.contentType === 'photo' && '🖼️ 图片'}
                              {broadcast.contentType === 'video' && '🎬 视频'}
                              {broadcast.contentType === 'document' && '📄 文档'}
                              {(!broadcast.contentType || broadcast.contentType === 'text') && '📝 文本'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              broadcast.status === 'completed' ? 'bg-green-100 text-green-700' :
                              broadcast.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                              broadcast.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {broadcast.status === 'draft' && '草稿'}
                              {broadcast.status === 'sending' && '发送中'}
                              {broadcast.status === 'completed' && '已完成'}
                              {broadcast.status === 'failed' && '失败'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {broadcast.targetType === 'all' ? '所有用户' : 
                             broadcast.targetType === 'active' ? '活跃用户' :
                             broadcast.targetType === 'group' ? '群组' :
                             broadcast.targetType}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {broadcast.totalUsers || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600">
                            {broadcast.sentCount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            {broadcast.failedCount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className={`font-medium ${
                              parseFloat(successRate) >= 90 ? 'text-green-600' :
                              parseFloat(successRate) >= 70 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {successRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {broadcast.repeatEnabled ? (
                              <div className="text-orange-600">
                                <div className="font-medium">✓ 已启用</div>
                                <div className="text-xs">
                                  {broadcast.repeatCount || 0}
                                  {broadcast.maxRepeatCount > 0 ? `/${broadcast.maxRepeatCount}` : '/∞'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {broadcast.nextSendAt ? (
                              <div className="text-xs">
                                {new Date(broadcast.nextSendAt).toLocaleString('zh-CN', { 
                                  timeZone: 'Asia/Shanghai',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        
  );
}
