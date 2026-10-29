export default function TelegramMenuTab({ templates, setTemplates, broadcasts, setBroadcasts, groups, setGroups, stats, setStats,
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">主菜单按钮配置</h2>
              <div className="flex gap-2">
                <button
                  onClick={resetMenu}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  重置默认
                </button>
                <button
                  onClick={addMenuButton}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + 添加按钮
                </button>
                <button
                  onClick={saveMenu}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存菜单'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
              <h3 className="font-bold mb-4">预览效果</h3>
              <div className="bg-slate-50 rounded-lg p-4 max-w-md">
                <div className="text-sm text-slate-600 mb-3">📋 主菜单</div>
                <div className="space-y-2">
                  {Object.entries(
                    menu.buttons
                      .filter(btn => btn.enabled)
                      .reduce((acc, btn) => {
                        if (!acc[btn.row]) acc[btn.row] = [];
                        acc[btn.row].push(btn);
                        return acc;
                      }, {})
                  ).map(([row, buttons]) => (
                    <div key={row} className="flex gap-2">
                      {buttons
                        .sort((a, b) => a.col - b.col)
                        .map((btn, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-center text-sm"
                          >
                            {btn.text}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {menu.buttons.map((button, index) => (
                <div key={index} className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex gap-3 items-start">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveMenuButton(index, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveMenuButton(index, 'down')}
                        disabled={index === menu.buttons.length - 1}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-6 gap-3">
                      <input
                        type="text"
                        value={button.text}
                        onChange={(e) => updateMenuButton(index, 'text', e.target.value)}
                        className="col-span-2 px-3 py-2 border border-slate-300 rounded"
                        placeholder="按钮文字（支持emoji）"
                      />
                      
                      <select
                        value={button.type}
                        onChange={(e) => updateMenuButton(index, 'type', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded"
                      >
                        <option value="system">系统功能</option>
                        <option value="callback">自定义回调</option>
                        <option value="url">外部链接</option>
                      </select>
                      
                      {button.type === 'system' ? (
                        <select
                          value={button.action}
                          onChange={(e) => updateMenuButton(index, 'action', e.target.value)}
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded"
                        >
                          {systemActions.map(action => (
                            <option key={action.value} value={action.value}>
                              {action.icon} {action.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={button.action}
                          onChange={(e) => updateMenuButton(index, 'action', e.target.value)}
                          className="col-span-2 px-3 py-2 border border-slate-300 rounded"
                          placeholder={button.type === 'url' ? 'https://...' : 'callback_data'}
                        />
                      )}
                      
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={button.row}
                          onChange={(e) => updateMenuButton(index, 'row', parseInt(e.target.value))}
                          className="w-16 px-2 py-2 border border-slate-300 rounded text-center"
                          placeholder="行"
                          min="0"
                        />
                        <input
                          type="number"
                          value={button.col}
                          onChange={(e) => updateMenuButton(index, 'col', parseInt(e.target.value))}
                          className="w-16 px-2 py-2 border border-slate-300 rounded text-center"
                          placeholder="列"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={button.enabled}
                        onChange={(e) => updateMenuButton(index, 'enabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">启用</span>
                    </label>
                    
                    <button
                      onClick={() => removeMenuButton(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-2">💡 使用说明</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>按钮文字</strong>：支持emoji，建议使用emoji增强视觉效果</li>
                <li>• <strong>系统功能</strong>：选择预定义的功能（代付、订单、工单等）</li>
                <li>• <strong>自定义回调</strong>：输入callback_data，需要在代码中处理</li>
                <li>• <strong>外部链接</strong>：输入完整URL，点击后在浏览器打开</li>
                <li>• <strong>行列设置</strong>：行号相同的按钮在同一行，列号决定顺序</li>
                <li>• <strong>排序</strong>：使用↑↓按钮调整显示顺序</li>
              </ul>
            </div>
          </div>
        
  );
}
