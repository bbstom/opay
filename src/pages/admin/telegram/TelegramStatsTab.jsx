export default function TelegramStatsTab({ templates, setTemplates, broadcasts, setBroadcasts, groups, setGroups, stats, setStats,
  menu, setMenu, systemActions, setSystemActions, contents, setContents, editingContent, setEditingContent,
  showContentEditor, setShowContentEditor, loading, setLoading, selectedCategory, setSelectedCategory,
  templateForm, setTemplateForm, broadcastForm, setBroadcastForm, showTemplateModal, setShowTemplateModal,
  showBroadcastModal, setShowBroadcastModal, editingTemplate, setEditingTemplate, editingBroadcast, setEditingBroadcast,
  saveTemplate, deleteTemplate, createBroadcast, sendBroadcast, editBroadcast, updateBroadcast, deleteBroadcast,
  stopRepeat, triggerBroadcast, viewDetails, duplicateBroadcast, saveBroadcast, addButton, updateButton, removeButton,
  resetTemplateForm, resetBroadcastForm, editTemplate, saveMenu, resetMenu, addMenuButton, updateMenuButton,
  removeMenuButton, moveMenuButton, fetchData }) {
  return (

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-slate-600 mb-2">总用户数</div>
              <div className="text-xl font-bold text-slate-900">{stats.totalUsers || 0}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-slate-600 mb-2">今日新增</div>
              <div className="text-xl font-bold text-blue-600">{stats.todayUsers || 0}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-slate-600 mb-2">活跃用户（7天）</div>
              <div className="text-xl font-bold text-green-600">{stats.activeUsers || 0}</div>
            </div>
          </div>
        
  );
}
