export default function TelegramBroadcastsTab({ templates, setTemplates, broadcasts, setBroadcasts, groups, setGroups, stats, setStats,
  menu, setMenu, systemActions, setSystemActions, contents, setContents, editingContent, setEditingContent,
  showContentEditor, setShowContentEditor, loading, setLoading, selectedCategory, setSelectedCategory,
  templateForm, setTemplateForm, broadcastForm, setBroadcastForm, showTemplateModal, setShowTemplateModal,
  showBroadcastModal, setShowBroadcastModal, editingTemplate, setEditingTemplate, editingBroadcast, setEditingBroadcast,
  saveTemplate, deleteTemplate, createBroadcast, sendBroadcast, editBroadcast, updateBroadcast, deleteBroadcast,
  stopRepeat, triggerBroadcast, viewDetails, duplicateBroadcast, saveBroadcast, addButton, updateButton, removeButton,
  resetTemplateForm, resetBroadcastForm, editTemplate, saveMenu, resetMenu, addMenuButton, updateMenuButton,
  removeMenuButton, moveMenuButton, fetchData }) {
  return (
    <>
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">群发消息</h2>
              <button
                onClick={() => {
                  setEditingBroadcast(null); // 清除编辑状态
                  resetBroadcastForm();
                  setShowBroadcastModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 创建群发
              </button>
            </div>

            <div className="grid gap-4">
              {broadcasts.map(broadcast => (
                <div key={broadcast._id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{broadcast.title}</h3>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {broadcast.contentType === 'photo' && '🖼️ 图片'}
                          {broadcast.contentType === 'video' && '🎬 视频'}
                          {broadcast.contentType === 'document' && '📄 文档'}
                          {(!broadcast.contentType || broadcast.contentType === 'text') && '📝 文本'}
                        </span>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded ${
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
                    </div>
                    <div className="flex gap-2">
                      {broadcast.status === 'draft' && (
                        <>
                          <button
                            onClick={() => editBroadcast(broadcast)}
                            className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                            disabled={loading}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => sendBroadcast(broadcast._id)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={loading}
                          >
                            发送
                          </button>
                        </>
                      )}
                      {(broadcast.status === 'completed' || broadcast.status === 'failed') && (
                        <>
                          <button
                            onClick={() => editBroadcast(broadcast)}
                            className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                            disabled={loading}
                            title="编辑内容"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => triggerBroadcast(broadcast._id)}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            disabled={loading}
                            title="立即发送一次"
                          >
                            立即发送
                          </button>
                          {broadcast.repeatEnabled && (
                            <button
                              onClick={() => stopRepeat(broadcast._id)}
                              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                              disabled={loading}
                              title="停止重复发送"
                            >
                              停止重复
                            </button>
                          )}
                          <button
                            onClick={() => viewDetails(broadcast)}
                            className="px-3 py-1.5 text-sm text-purple-600 border border-purple-600 rounded hover:bg-purple-50"
                            disabled={loading}
                            title="查看详细信息"
                          >
                            详情
                          </button>
                          <button
                            onClick={() => duplicateBroadcast(broadcast)}
                            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-600 rounded hover:bg-slate-50"
                            disabled={loading}
                            title="复制为新草稿"
                          >
                            复制
                          </button>
                        </>
                      )}
                      {(broadcast.status === 'draft' || broadcast.status === 'failed' || broadcast.status === 'completed') && (
                        <button
                          onClick={() => deleteBroadcast(broadcast._id)}
                          className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                          disabled={loading}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded p-4 text-sm font-mono whitespace-pre-wrap mb-4">
                    {broadcast.mediaUrl && (
                      <div className="text-blue-600 mb-2">📎 {broadcast.mediaUrl.substring(0, 50)}...</div>
                    )}
                    {broadcast.content.substring(0, 150)}
                    {broadcast.content.length > 150 && '...'}
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    <span>目标: {
                      broadcast.targetType === 'all' ? '所有用户' : 
                      broadcast.targetType === 'active' ? '活跃用户' :
                      broadcast.targetType === 'group' ? '群组' :
                      broadcast.targetType
                    }</span>
                    {broadcast.totalUsers > 0 && (
                      <>
                        <span>总数: {broadcast.totalUsers}</span>
                        <span>成功: {broadcast.sentCount}</span>
                        <span>失败: {broadcast.failedCount}</span>
                      </>
                    )}
                  </div>
                  {/* 重复发送状态 */}
                  {broadcast.repeatEnabled && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex gap-6 text-sm">
                      <span className="text-orange-600 font-medium">🔄 重复发送已启用</span>
                      <span className="text-slate-600">间隔: {broadcast.repeatInterval}小时</span>
                      <span className="text-slate-600">已发送: {broadcast.repeatCount || 0}次</span>
                      {broadcast.maxRepeatCount > 0 && (
                        <span className="text-slate-600">最大: {broadcast.maxRepeatCount}次</span>
                      )}
                      {broadcast.nextSendAt && (
                        <span className="text-blue-600">
                          下次: {new Date(broadcast.nextSendAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                        </span>
                      )}
                    </div>
                  )}
                  {/* 定时发送状态 */}
                  {broadcast.scheduledAt && broadcast.status === 'draft' && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-blue-600">
                      ⏰ 定时发送: {new Date(broadcast.scheduledAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        
      {showBroadcastModal && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold">{editingBroadcast ? '编辑群发消息' : '创建群发消息'}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">群发标题</label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="例如: 系统维护通知"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">内容类型</label>
                  <select
                    value={broadcastForm.contentType || 'text'}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, contentType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="text">📝 纯文本</option>
                    <option value="photo">🖼️ 图片</option>
                    <option value="video">🎬 视频</option>
                    <option value="document">📄 文档</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">解析模式</label>
                  <select
                    value={broadcastForm.parseMode || 'HTML'}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, parseMode: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="HTML">HTML</option>
                    <option value="Markdown">Markdown</option>
                    <option value="MarkdownV2">MarkdownV2</option>
                  </select>
                </div>
              </div>

              {broadcastForm.contentType !== 'text' && (
                <div>
                  <label className="block text-sm font-medium mb-2">媒体URL</label>
                  <input
                    type="text"
                    value={broadcastForm.mediaUrl || ''}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, mediaUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="https://example.com/image.jpg 或 Telegram 文件 ID"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    💡 支持 HTTPS 链接或 Telegram 文件 ID
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">目标用户</label>
                <select
                  value={broadcastForm.targetType}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetType: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="all">👥 所有用户</option>
                  <option value="active">✅ 活跃用户（30天内）</option>
                  <option value="inactive">💤 不活跃用户</option>
                  <option value="group">👨‍👩‍👧‍👦 群组</option>
                </select>
              </div>

              {broadcastForm.targetType === 'group' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    选择群组/频道
                    <span className="text-xs text-slate-500 ml-2">
                      ({groups.length} 个可用)
                    </span>
                  </label>
                  
                  {groups.length > 0 ? (
                    <div className="space-y-2">
                      {groups.map(group => (
                        <label
                          key={group.chatId}
                          className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(broadcastForm.targetGroups || []).includes(group.chatId)}
                            onChange={(e) => {
                              const currentGroups = broadcastForm.targetGroups || [];
                              if (e.target.checked) {
                                setBroadcastForm({
                                  ...broadcastForm,
                                  targetGroups: [...currentGroups, group.chatId]
                                });
                              } else {
                                setBroadcastForm({
                                  ...broadcastForm,
                                  targetGroups: currentGroups.filter(id => id !== group.chatId)
                                });
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{group.title}</div>
                            <div className="text-xs text-slate-500">
                              {group.type === 'channel' && '📢 频道'}
                              {group.type === 'supergroup' && '👥 超级群组'}
                              {group.type === 'group' && '👥 群组'}
                              {' • '}
                              {group.botStatus === 'admin' && '👑 管理员'}
                              {group.botStatus === 'member' && '👤 成员'}
                              {' • '}
                              ID: {group.chatId}
                            </div>
                          </div>
                          {group.memberCount && (
                            <div className="text-sm text-slate-600">
                              {group.memberCount} 人
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="font-medium text-amber-900 mb-2">📢 未检测到群组</div>
                      <div className="text-sm text-amber-700 space-y-1">
                        <div>1. 将 Bot 添加到群组或频道</div>
                        <div>2. 在群组中发送任意消息</div>
                        <div>3. 刷新此页面查看群组列表</div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => fetchData()}
                          className="text-sm text-amber-700 hover:text-amber-900 underline"
                        >
                          🔄 刷新群组列表
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 手动输入选项 */}
                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      或手动输入 Chat ID
                    </summary>
                    <textarea
                      value={(broadcastForm.targetGroups || []).join('\n')}
                      onChange={(e) => setBroadcastForm({ 
                        ...broadcastForm, 
                        targetGroups: e.target.value.split('\n').filter(id => id.trim())
                      })}
                      className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                      rows={3}
                      placeholder="每行一个 Chat ID，例如：&#10;-1001234567890"
                    />
                  </details>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {broadcastForm.contentType === 'text' ? '消息内容' : '说明文字'}
                </label>
                <textarea
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                  rows={8}
                  placeholder={
                    broadcastForm.contentType === 'text' 
                      ? "输入群发消息内容，支持 HTML 标签..." 
                      : "输入媒体说明文字（可选）..."
                  }
                />
                {broadcastForm.parseMode === 'HTML' && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-600">HTML标签:</span>
                    <code className="px-2 py-1 bg-slate-100 rounded">&lt;b&gt;加粗&lt;/b&gt;</code>
                    <code className="px-2 py-1 bg-slate-100 rounded">&lt;i&gt;斜体&lt;/i&gt;</code>
                    <code className="px-2 py-1 bg-slate-100 rounded">&lt;code&gt;代码&lt;/code&gt;</code>
                    <code className="px-2 py-1 bg-slate-100 rounded">&lt;a href=""&gt;链接&lt;/a&gt;</code>
                  </div>
                )}
              </div>

              {/* 定时发送配置 */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">⏰ 定时发送（可选）</h4>
                <div>
                  <label className="block text-sm font-medium mb-2">发送时间</label>
                  <input
                    type="datetime-local"
                    value={broadcastForm.scheduledAt}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    留空表示立即发送，设置未来时间则定时发送
                  </p>
                </div>
              </div>

              {/* 重复发送配置 */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="repeatEnabled"
                    checked={broadcastForm.repeatEnabled}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, repeatEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="repeatEnabled" className="font-medium cursor-pointer">
                    🔄 启用重复发送
                  </label>
                </div>

                {broadcastForm.repeatEnabled && (
                  <div className="space-y-3 ml-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">重复间隔（小时）</label>
                      <input
                        type="number"
                        min="1"
                        value={broadcastForm.repeatInterval}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, repeatInterval: parseInt(e.target.value) || 24 })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="24"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        例如：24 = 每天发送一次，168 = 每周发送一次
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">最大重复次数</label>
                      <input
                        type="number"
                        min="0"
                        value={broadcastForm.maxRepeatCount}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, maxRepeatCount: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="0"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        0 = 无限重复，大于 0 = 重复指定次数后停止
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                      <p className="font-medium mb-1">💡 重复发送说明</p>
                      <ul className="text-xs space-y-1">
                        <li>• 首次发送后，系统会按设定的间隔自动重复发送</li>
                        <li>• 可随时在群发列表中停止重复</li>
                        <li>• 适合每日签到提醒、定期活动通知等场景</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">按钮配置（可选）</label>
                {broadcastForm.buttons.map((button, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => updateButton(index, 'text', e.target.value, 'broadcast')}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded"
                      placeholder="按钮文字"
                    />
                    <select
                      value={button.type}
                      onChange={(e) => updateButton(index, 'type', e.target.value, 'broadcast')}
                      className="px-3 py-2 border border-slate-300 rounded"
                    >
                      <option value="callback">回调</option>
                      <option value="url">链接</option>
                    </select>
                    <input
                      type="text"
                      value={button.data}
                      onChange={(e) => updateButton(index, 'data', e.target.value, 'broadcast')}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded"
                      placeholder={button.type === 'url' ? 'https://...' : 'callback_data'}
                    />
                    <button
                      onClick={() => removeButton(index, 'broadcast')}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addButton('broadcast')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + 添加按钮
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={saveBroadcast}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : (editingBroadcast ? '更新' : '创建')}
              </button>
            </div>
          </div>
        </div>
      
      )}
    </>
  );
}
