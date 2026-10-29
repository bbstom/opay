import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../api/client';
import AdminLayout from '../components/AdminLayout';
import TelegramCommandsTab from './admin/telegram/TelegramCommandsTab';
import TelegramMenuTab from './admin/telegram/TelegramMenuTab';
import TelegramContentsTab from './admin/telegram/TelegramContentsTab';
import TelegramTemplatesTab from './admin/telegram/TelegramTemplatesTab';
import TelegramBroadcastsTab from './admin/telegram/TelegramBroadcastsTab';
import TelegramStatsTab from './admin/telegram/TelegramStatsTab';
import TelegramBroadcastStatsTab from './admin/telegram/TelegramBroadcastStatsTab';
import TelegramBotsTab from './admin/telegram/TelegramBotsTab';

const TelegramManagePage = () => {
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') || 'commands';
  const [templates, setTemplates] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({});
  const [menu, setMenu] = useState(null);
  const [systemActions, setSystemActions] = useState([]);
  const [contents, setContents] = useState([]);
  const [editingContent, setEditingContent] = useState(null);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 模板表单
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'custom',
    content: '',
    parseMode: 'HTML',
    buttons: [],
    variables: [],
    enabled: true
  });

  // 群发表单
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    contentType: 'text',
    mediaUrl: '',
    parseMode: 'HTML',
    buttons: [],
    targetType: 'all',
    targetGroups: [],
    // 定时发送
    scheduledAt: '',
    // 重复发送
    repeatEnabled: false,
    repeatInterval: 24,
    maxRepeatCount: 0
  });

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingBroadcast, setEditingBroadcast] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'templates') {
        const res = await apiFetch('/api/telegram/templates');
        const data = await res.json();
        setTemplates(data);
      } else if (activeTab === 'broadcasts') {
        const res = await apiFetch('/api/telegram/broadcasts');
        const data = await res.json();
        setBroadcasts(data);
        
        // 同时获取群组列表
        const groupsRes = await apiFetch('/api/telegram/groups');
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      } else if (activeTab === 'menu') {
        const [menuRes, actionsRes] = await Promise.all([
          apiFetch('/api/telegram/menu'),
          apiFetch('/api/telegram/menu/system-actions')
        ]);
        const menuData = await menuRes.json();
        const actionsData = await actionsRes.json();
        setMenu(menuData);
        setSystemActions(actionsData);
      } else if (activeTab === 'contents') {
        const res = await apiFetch('/api/telegram/contents');
        const data = await res.json();
        setContents(data);
      } else if (activeTab === 'stats') {
        const res = await apiFetch('/api/telegram/stats');
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  // 保存模板
  const saveTemplate = async () => {
    setLoading(true);

    try {
      const url = editingTemplate 
        ? `/api/telegram/templates/${editingTemplate._id}`
        : '/api/telegram/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm)
      });

      if (res.ok) {
        alert(editingTemplate ? '模板已更新' : '模板已创建');
        setShowTemplateModal(false);
        setEditingTemplate(null);
        resetTemplateForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除模板
  const deleteTemplate = async (id) => {
    if (!confirm('确定要删除这个模板吗？')) return;

    try {
      const res = await apiFetch(`/api/telegram/templates/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('模板已删除');
        fetchData();
      }
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  // 创建群发
  const createBroadcast = async () => {
    setLoading(true);

    try {
      // 准备数据，转换 scheduledAt 为 UTC
      const data = { ...broadcastForm };
      if (data.scheduledAt) {
        // datetime-local 返回的是本地时间，需要转换为 UTC
        data.scheduledAt = new Date(data.scheduledAt).toISOString();
      } else {
        // 如果没有设置，删除该字段
        delete data.scheduledAt;
      }

      const res = await apiFetch('/api/telegram/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert('群发已创建');
        setShowBroadcastModal(false);
        setEditingBroadcast(null); // 清除编辑状态
        resetBroadcastForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '创建失败');
      }
    } catch (error) {
      alert('创建失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 发送群发
  const sendBroadcast = async (id) => {
    if (!confirm('确定要发送这条群发消息吗？')) return;

    setLoading(true);

    try {
      const res = await apiFetch(`/api/telegram/broadcasts/${id}/send`, {
        method: 'POST'
      });

      const data = await res.json();
      if (res.ok) {
        alert(`开始发送群发，目标用户: ${data.totalUsers}`);
        fetchData();
      } else {
        alert(data.error || '发送失败');
      }
    } catch (error) {
      alert('发送失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 编辑群发
  const editBroadcast = (broadcast) => {
    // 转换 scheduledAt 为 datetime-local 格式
    let scheduledAtValue = '';
    if (broadcast.scheduledAt) {
      const date = new Date(broadcast.scheduledAt);
      // 转换为本地时间的 datetime-local 格式
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      scheduledAtValue = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setBroadcastForm({
      title: broadcast.title,
      content: broadcast.content,
      contentType: broadcast.contentType || 'text',
      mediaUrl: broadcast.mediaUrl || '',
      parseMode: broadcast.parseMode || 'HTML',
      targetType: broadcast.targetType,
      targetUsers: broadcast.targetUsers || [],
      targetGroups: broadcast.targetGroups || [],
      buttons: broadcast.buttons || [],
      scheduledAt: scheduledAtValue,
      repeatEnabled: broadcast.repeatEnabled || false,
      repeatInterval: broadcast.repeatInterval || 24,
      maxRepeatCount: broadcast.maxRepeatCount || 0
    });
    setEditingBroadcast(broadcast);
    setShowBroadcastModal(true);
  };

  // 更新群发
  const updateBroadcast = async () => {
    setLoading(true);

    try {
      // 准备数据，转换 scheduledAt 为 UTC
      const data = { ...broadcastForm };
      if (data.scheduledAt) {
        data.scheduledAt = new Date(data.scheduledAt).toISOString();
      } else {
        delete data.scheduledAt;
      }

      // 如果是已完成的群发，重置状态为草稿
      if (editingBroadcast.status === 'completed' || editingBroadcast.status === 'failed') {
        data.status = 'draft';
        data.sentCount = 0;
        data.failedCount = 0;
        data.totalUsers = 0;
      }

      const res = await apiFetch(`/api/telegram/broadcasts/${editingBroadcast._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert('群发已更新');
        setShowBroadcastModal(false);
        setEditingBroadcast(null);
        resetBroadcastForm();
        fetchData();
      } else {
        const data = await res.json();
        alert(`更新失败: ${data.error}`);
      }
    } catch (error) {
      alert('更新失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除群发
  const deleteBroadcast = async (id) => {
    if (!confirm('确定要删除这条群发消息吗？此操作不可恢复！')) return;

    setLoading(true);

    try {
      const res = await apiFetch(`/api/telegram/broadcasts/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('删除成功');
        fetchData();
      } else {
        const data = await res.json();
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      alert('删除失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 停止重复发送
  const stopRepeat = async (id) => {
    if (!confirm('确定要停止重复发送吗？')) return;

    setLoading(true);

    try {
      const res = await apiFetch(`/api/telegram/broadcasts/${id}/stop-repeat`, {
        method: 'POST'
      });

      if (res.ok) {
        alert('已停止重复发送');
        fetchData();
      } else {
        const data = await res.json();
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      alert('操作失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 手动触发发送
  const triggerBroadcast = async (id) => {
    if (!confirm('确定要立即发送这条群发消息吗？')) return;

    setLoading(true);

    try {
      const res = await apiFetch(`/api/telegram/broadcasts/${id}/trigger`, {
        method: 'POST'
      });

      if (res.ok) {
        alert('已触发发送');
        fetchData();
      } else {
        const data = await res.json();
        alert(`操作失败: ${data.error}`);
      }
    } catch (error) {
      alert('操作失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 查看详情
  const viewDetails = async (broadcast) => {
    setLoading(true);

    try {
      const res = await apiFetch(`/api/telegram/broadcasts/${broadcast._id}/stats`);

      if (res.ok) {
        const stats = await res.json();
        
        // 构建详细信息
        let message = `📊 群发详情\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📝 标题: ${broadcast.title}\n`;
        message += `📄 类型: ${
          broadcast.contentType === 'photo' ? '图片' :
          broadcast.contentType === 'video' ? '视频' :
          broadcast.contentType === 'document' ? '文档' :
          '文本'
        }\n`;
        message += `🎯 目标: ${
          broadcast.targetType === 'all' ? '所有用户' : 
          broadcast.targetType === 'active' ? '活跃用户' :
          broadcast.targetType === 'group' ? '群组' :
          broadcast.targetType
        }\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        message += `📈 发送统计\n`;
        message += `总用户数: ${stats.totalUsers}\n`;
        message += `成功发送: ${stats.sentCount}\n`;
        message += `发送失败: ${stats.failedCount}\n`;
        message += `成功率: ${stats.successRate}%\n\n`;
        
        if (broadcast.repeatEnabled) {
          message += `🔄 重复发送\n`;
          message += `状态: 已启用\n`;
          message += `间隔: ${broadcast.repeatInterval} 小时\n`;
          message += `已发送: ${broadcast.repeatCount || 0} 次\n`;
          message += `最大次数: ${broadcast.maxRepeatCount || '无限制'}\n`;
          if (broadcast.nextSendAt) {
            message += `下次发送: ${new Date(broadcast.nextSendAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
          }
          message += `\n`;
        }
        
        if (broadcast.scheduledAt) {
          message += `⏰ 定时发送\n`;
          message += `设定时间: ${new Date(broadcast.scheduledAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n\n`;
        }
        
        if (broadcast.lastSentAt) {
          message += `📅 最后发送: ${new Date(broadcast.lastSentAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
        }
        
        if (broadcast.createdAt) {
          message += `📅 创建时间: ${new Date(broadcast.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
        }
        
        // 如果有失败，显示失败详情
        if (stats.failedCount > 0 && broadcast.repeatHistory && broadcast.repeatHistory.length > 0) {
          const lastHistory = broadcast.repeatHistory[broadcast.repeatHistory.length - 1];
          
          if (lastHistory.failedDetails && lastHistory.failedDetails.length > 0) {
            message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            message += `❌ 最近失败详情 (最多显示 10 条)\n\n`;
            
            lastHistory.failedDetails.forEach((detail, index) => {
              message += `${index + 1}. TG ${detail.telegramId}\n`;
              if (detail.username) {
                message += `   用户: @${detail.username}\n`;
              }
              message += `   错误: ${detail.error}\n`;
              if (detail.errorCode) {
                message += `   代码: ${detail.errorCode}\n`;
              }
              message += `\n`;
            });
          } else {
            message += `\n⚠️ 有 ${stats.failedCount} 条消息发送失败\n`;
            message += `常见原因:\n`;
            message += `• 用户屏蔽了 Bot\n`;
            message += `• 用户删除了账号\n`;
            message += `• 按钮 URL 格式错误\n`;
            message += `• 媒体文件无法访问\n`;
          }
        }
        
        alert(message);
      } else {
        const data = await res.json();
        alert(`获取详情失败: ${data.error}`);
      }
    } catch (error) {
      alert('获取详情失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 复制为新草稿
  const duplicateBroadcast = (broadcast) => {
    // 转换 scheduledAt 为 datetime-local 格式（如果有）
    let scheduledAtValue = '';
    if (broadcast.scheduledAt) {
      const date = new Date(broadcast.scheduledAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      scheduledAtValue = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setBroadcastForm({
      title: `${broadcast.title} (副本)`,
      content: broadcast.content,
      contentType: broadcast.contentType || 'text',
      mediaUrl: broadcast.mediaUrl || '',
      parseMode: broadcast.parseMode || 'HTML',
      targetType: broadcast.targetType,
      targetUsers: broadcast.targetUsers || [],
      targetGroups: broadcast.targetGroups || [],
      buttons: broadcast.buttons || [],
      scheduledAt: scheduledAtValue,
      repeatEnabled: broadcast.repeatEnabled || false,
      repeatInterval: broadcast.repeatInterval || 24,
      maxRepeatCount: broadcast.maxRepeatCount || 0
    });
    setEditingBroadcast(null); // 不设置编辑状态，作为新建
    setShowBroadcastModal(true);
  };

  // 保存群发（创建或更新）
  const saveBroadcast = () => {
    if (editingBroadcast) {
      updateBroadcast();
    } else {
      createBroadcast();
    }
  };

  // 添加按钮
  const addButton = (formType) => {
    const newButton = { text: '', type: 'callback', data: '', row: 0 };
    if (formType === 'template') {
      setTemplateForm({
        ...templateForm,
        buttons: [...templateForm.buttons, newButton]
      });
    } else {
      setBroadcastForm({
        ...broadcastForm,
        buttons: [...broadcastForm.buttons, newButton]
      });
    }
  };

  // 更新按钮
  const updateButton = (index, field, value, formType) => {
    if (formType === 'template') {
      const newButtons = [...templateForm.buttons];
      newButtons[index][field] = value;
      setTemplateForm({ ...templateForm, buttons: newButtons });
    } else {
      const newButtons = [...broadcastForm.buttons];
      newButtons[index][field] = value;
      setBroadcastForm({ ...broadcastForm, buttons: newButtons });
    }
  };

  // 删除按钮
  const removeButton = (index, formType) => {
    if (formType === 'template') {
      setTemplateForm({
        ...templateForm,
        buttons: templateForm.buttons.filter((_, i) => i !== index)
      });
    } else {
      setBroadcastForm({
        ...broadcastForm,
        buttons: broadcastForm.buttons.filter((_, i) => i !== index)
      });
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      type: 'custom',
      content: '',
      parseMode: 'HTML',
      buttons: [],
      variables: [],
      enabled: true
    });
  };

  const resetBroadcastForm = () => {
    setBroadcastForm({
      title: '',
      content: '',
      contentType: 'text',
      mediaUrl: '',
      parseMode: 'HTML',
      buttons: [],
      targetType: 'all',
      targetGroups: [],
      scheduledAt: '',
      repeatEnabled: false,
      repeatInterval: 24,
      maxRepeatCount: 0
    });
  };

  const editTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm(template);
    setShowTemplateModal(true);
  };

  // 菜单管理函数
  const saveMenu = async () => {
    setLoading(true);

    try {
      const res = await apiFetch('/api/telegram/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menu)
      });

      if (res.ok) {
        alert('菜单已保存');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      alert('保存失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetMenu = async () => {
    if (!confirm('确定要重置为默认菜单吗？')) return;

    setLoading(true);

    try {
      const res = await apiFetch('/api/telegram/menu/reset', {
        method: 'POST'
      });

      if (res.ok) {
        alert('菜单已重置');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '重置失败');
      }
    } catch (error) {
      alert('重置失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addMenuButton = () => {
    const newButton = {
      text: '新按钮',
      type: 'system',
      action: 'payment_usdt',
      row: 0,
      col: 0,
      enabled: true,
      order: menu.buttons.length
    };
    setMenu({
      ...menu,
      buttons: [...menu.buttons, newButton]
    });
  };

  const updateMenuButton = (index, field, value) => {
    const newButtons = [...menu.buttons];
    newButtons[index][field] = value;
    setMenu({ ...menu, buttons: newButtons });
  };

  const removeMenuButton = (index) => {
    setMenu({
      ...menu,
      buttons: menu.buttons.filter((_, i) => i !== index)
    });
  };

  const moveMenuButton = (index, direction) => {
    const newButtons = [...menu.buttons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newButtons.length) return;
    
    [newButtons[index], newButtons[targetIndex]] = [newButtons[targetIndex], newButtons[index]];
    
    // 更新order
    newButtons.forEach((btn, i) => {
      btn.order = i;
    });
    
    setMenu({ ...menu, buttons: newButtons });
  };

  const tabProps = {
    templates, setTemplates, broadcasts, setBroadcasts, groups, setGroups, stats, setStats,
    menu, setMenu, systemActions, setSystemActions, contents, setContents, editingContent, setEditingContent,
    showContentEditor, setShowContentEditor, loading, setLoading, selectedCategory, setSelectedCategory,
    templateForm, setTemplateForm, broadcastForm, setBroadcastForm, showTemplateModal, setShowTemplateModal,
    showBroadcastModal, setShowBroadcastModal, editingTemplate, setEditingTemplate, editingBroadcast, setEditingBroadcast,
    saveTemplate, deleteTemplate, createBroadcast, sendBroadcast, editBroadcast, updateBroadcast, deleteBroadcast,
    stopRepeat, triggerBroadcast, viewDetails, duplicateBroadcast, saveBroadcast, addButton, updateButton, removeButton,
    resetTemplateForm, resetBroadcastForm, editTemplate, saveMenu, resetMenu, addMenuButton, updateMenuButton,
    removeMenuButton, moveMenuButton, fetchData
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {activeTab === 'bots' && <TelegramBotsTab />}
        {activeTab === 'commands' && <TelegramCommandsTab />}
        {activeTab === 'menu' && menu && <TelegramMenuTab {...tabProps} />}
        {activeTab === 'contents' && <TelegramContentsTab {...tabProps} />}
        {activeTab === 'templates' && <TelegramTemplatesTab {...tabProps} />}
        {activeTab === 'broadcasts' && <TelegramBroadcastsTab {...tabProps} />}
        {activeTab === 'stats' && <TelegramStatsTab {...tabProps} />}
        {activeTab === 'broadcast-stats' && <TelegramBroadcastStatsTab {...tabProps} />}
      </div>
    </AdminLayout>
  );
};

export default TelegramManagePage;
