export default function TelegramTemplatesTab({ templates, setTemplates, broadcasts, setBroadcasts, groups, setGroups, stats, setStats,
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
              <h2 className="text-xl font-bold">消息模板</h2>
              <button
                onClick={() => {
                  resetTemplateForm();
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 创建模板
              </button>
            </div>

            <div className="grid gap-4">
              {templates.map(template => (
                <div key={template._id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{template.name}</h3>
                      <span className="text-sm text-slate-500">{template.type}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTemplate(template)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteTemplate(template._id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded p-4 text-sm font-mono whitespace-pre-wrap">
                    {template.content.substring(0, 200)}
                    {template.content.length > 200 && '...'}
                  </div>
                  {template.buttons.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm text-slate-600">按钮: {template.buttons.length} 个</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        
      {showTemplateModal && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold">
                {editingTemplate ? '编辑模板' : '创建模板'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">模板名称</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="例如: 欢迎消息"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">模板类型</label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="welcome">欢迎消息</option>
                  <option value="payment_success">支付成功通知</option>
                  <option value="transfer_complete">代付完成通知</option>
                  <option value="transfer_failed">代付失败通知</option>
                  <option value="order_completed">订单完成通知</option>
                  <option value="order_failed">订单失败通知</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">消息内容</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                  rows={10}
                  placeholder="支持HTML标签和变量 {{orderId}}, {{amount}} 等"
                />
                <div className="text-xs text-slate-500 mt-1">
                  提示: 使用 &lt;b&gt; 加粗, &lt;code&gt; 代码, &lt;i&gt; 斜体
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">按钮配置</label>
                {templateForm.buttons.map((button, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => updateButton(index, 'text', e.target.value, 'template')}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded"
                      placeholder="按钮文字"
                    />
                    <select
                      value={button.type}
                      onChange={(e) => updateButton(index, 'type', e.target.value, 'template')}
                      className="px-3 py-2 border border-slate-300 rounded"
                    >
                      <option value="callback">回调</option>
                      <option value="url">链接</option>
                    </select>
                    <input
                      type="text"
                      value={button.data}
                      onChange={(e) => updateButton(index, 'data', e.target.value, 'template')}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded"
                      placeholder={button.type === 'url' ? 'https://...' : 'callback_data'}
                    />
                    <input
                      type="number"
                      value={button.row}
                      onChange={(e) => updateButton(index, 'row', parseInt(e.target.value), 'template')}
                      className="w-16 px-3 py-2 border border-slate-300 rounded"
                      placeholder="行"
                    />
                    <button
                      onClick={() => removeButton(index, 'template')}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addButton('template')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + 添加按钮
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={saveTemplate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      
      )}
    </>
  );
}
