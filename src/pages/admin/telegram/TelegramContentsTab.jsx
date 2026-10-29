import TelegramContentEditor from '../../../components/TelegramContentEditor';
import { apiFetch } from '../../../api/client';

export default function TelegramContentsTab({ templates, setTemplates, broadcasts, setBroadcasts, groups, setGroups, stats, setStats,
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
              <h2 className="text-xl font-bold">内容管理</h2>
              <button
                onClick={() => {
                  setEditingContent(null);
                  setShowContentEditor(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 创建内容
              </button>
            </div>

            {/* 分类过滤 */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {['all', 'welcome', 'payment', 'order', 'help', 'custom'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-sm border rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'all' && '全部'}
                  {cat === 'welcome' && '欢迎页面'}
                  {cat === 'payment' && '代付交互'}
                  {cat === 'order' && '订单相关'}
                  {cat === 'help' && '帮助信息'}
                  {cat === 'custom' && '自定义'}
                </button>
              ))}
            </div>

            {/* 内容列表 */}
            <div className="grid gap-4">
              {contents
                .filter(content => selectedCategory === 'all' || content.category === selectedCategory)
                .map(content => (
                <div key={content._id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{content.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {content.category}
                        </span>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                          {content.content.type}
                        </span>
                        <span className="text-xs text-slate-500">
                          key: {content.key}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingContent(content);
                          setShowContentEditor(true);
                        }}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        编辑
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('确定要删除这个内容吗？')) return;
                          try {
                            const res = await apiFetch(`/api/telegram/contents/${content.key}`, {
                              method: 'DELETE'
                            });
                            if (res.ok) {
                              alert('内容已删除');
                              fetchData();
                            }
                          } catch (error) {
                            alert('删除失败: ' + error.message);
                          }
                        }}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded p-4 text-sm font-mono whitespace-pre-wrap mb-4">
                    {content.content.text?.substring(0, 200)}
                    {content.content.text?.length > 200 && '...'}
                  </div>

                  <div className="flex gap-6 text-sm text-slate-600">
                    {content.buttons?.length > 0 && (
                      <span>按钮: {content.buttons.length} 个</span>
                    )}
                    {content.variables?.length > 0 && (
                      <span>变量: {content.variables.length} 个</span>
                    )}
                    {content.features?.copyable && (
                      <span>✅ 支持复制</span>
                    )}
                    <span className={content.enabled ? 'text-green-600' : 'text-slate-400'}>
                      {content.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                </div>
              ))}

              {contents.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p className="mb-4">暂无内容配置</p>
                  <button
                    onClick={async () => {
                      try {
                        const res = await apiFetch('/api/telegram/contents/init-defaults', {
                          method: 'POST'
                        });
                        if (res.ok) {
                          alert('默认内容已初始化');
                          fetchData();
                        }
                      } catch (error) {
                        alert('初始化失败: ' + error.message);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    初始化默认内容
                  </button>
                </div>
              )}
            </div>
          </div>
        
      {showContentEditor && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold">
                {editingContent ? '编辑内容' : '创建内容'}
              </h2>
            </div>
            
            <div className="p-6">
              <TelegramContentEditor
                content={editingContent}
                onSave={async (formData) => {
                  try {
                    const url = editingContent 
                      ? `/api/telegram/contents/${editingContent.key}`
                      : '/api/telegram/contents';
                    
                    const method = editingContent ? 'PUT' : 'POST';

                    const res = await apiFetch(url, {
                      method,
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(formData)
                    });

                    if (res.ok) {
                      const data = await res.json();
                      // 显示是创建还是更新
                      if (data.isUpdate !== undefined) {
                        alert(data.isUpdate ? '内容已更新（已存在的内容）' : '内容已创建');
                      } else {
                        alert(editingContent ? '内容已更新' : '内容已创建');
                      }
                      setShowContentEditor(false);
                      setEditingContent(null);
                      fetchData();
                    } else {
                      const data = await res.json();
                      alert(data.error || '操作失败');
                    }
                  } catch (error) {
                    alert('操作失败: ' + error.message);
                  }
                }}
                onCancel={() => {
                  setShowContentEditor(false);
                  setEditingContent(null);
                }}
              />
            </div>
          </div>
        </div>
      
      )}
    </>
  );
}
