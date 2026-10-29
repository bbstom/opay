import { useEffect, useState } from 'react';
import { apiFetch } from '../../../api/client';
import { HtmlBar, PageHint, PhoneFrame, TgBubble } from './telegramUi';

const emptyForm = () => ({
  title: '',
  content: '',
  contentType: 'text',
  mediaUrl: '',
  parseMode: 'HTML',
  buttons: [],
  targetType: 'all',
  targetGroups: [],
  scheduledAt: ''
});

const statusText = {
  draft: '草稿',
  sending: '发送中',
  completed: '已发出',
  failed: '失败'
};

export default function TelegramBroadcastsTab() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [bRes, gRes] = await Promise.all([
      apiFetch('/api/telegram/broadcasts'),
      apiFetch('/api/telegram/groups')
    ]);
    setBroadcasts(await bRes.json());
    const list = await gRes.json();
    setGroups(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    load().catch((err) => console.error('加载群发失败:', err));
  }, []);

  const patch = (next) => setForm((prev) => ({ ...prev, ...next }));

  const payload = () => {
    const data = { ...form };
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt).toISOString();
    else delete data.scheduledAt;
    if (!data.title) data.title = (data.content || '群发').slice(0, 24);
    if (data.mediaUrl) data.contentType = 'photo';
    else data.contentType = 'text';
    return data;
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      const data = payload();
      const url = editingId ? `/api/telegram/broadcasts/${editingId}` : '/api/telegram/broadcasts';
      const res = await apiFetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const body = await res.json();
      if (!res.ok) {
        alert(body.error || '保存失败');
        return null;
      }
      const id = body._id || editingId;
      if (id) setEditingId(id);
      await load();
      return id;
    } finally {
      setLoading(false);
    }
  };

  const sendNow = async () => {
    if (!form.content.trim() && !form.mediaUrl) {
      alert('先写内容或配图');
      return;
    }
    if (!confirm('确定发给所选对象？')) return;
    const id = await saveDraft();
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/telegram/broadcasts/${id}/send`, { method: 'POST' });
      const data = await res.json();
      alert(res.ok
        ? (data.scheduledAt ? '已预约发送' : `开始发送，约 ${data.totalUsers || 0} 人`)
        : (data.error || '发送失败'));
      setForm(emptyForm());
      setEditingId(null);
      load();
    } finally {
      setLoading(false);
    }
  };

  const fill = (item) => {
    let scheduledAt = '';
    if (item.scheduledAt) {
      const d = new Date(item.scheduledAt);
      scheduledAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      content: item.content || '',
      contentType: item.contentType || 'text',
      mediaUrl: item.mediaUrl || '',
      parseMode: item.parseMode || 'HTML',
      buttons: item.buttons || [],
      targetType: item.targetType || 'all',
      targetGroups: item.targetGroups || [],
      scheduledAt
    });
  };

  const remove = async (id) => {
    if (!confirm('删除这条群发？')) return;
    await apiFetch(`/api/telegram/broadcasts/${id}`, { method: 'DELETE' });
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm());
    }
    load();
  };

  const addButton = () => patch({ buttons: [...form.buttons, { text: '', type: 'url', data: '' }] });
  const setButton = (index, field, value) => {
    const buttons = form.buttons.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn));
    patch({ buttons });
  };
  const broadcastGroups = groups.filter((g) => g.allowBroadcast !== false);

  return (
    <div>
      <PageHint title="群发">
        写一段 HTML，可配图、可带按钮。发给全部 Bot 用户，或发给已打开「可手动群发」的群。能量成交推群在「连接」里开，不必在这里发。
      </PageHint>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <input
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="标题（可选，不填就用正文前几个字）"
          />
          <HtmlBar textareaId="tg-broadcast-text" value={form.content} onChange={(content) => patch({ content })} />
          <textarea
            id="tg-broadcast-text"
            value={form.content}
            onChange={(e) => patch({ content: e.target.value })}
            rows={8}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm"
            placeholder="支持 <b>粗体</b> <i>斜体</i> <code>代码</code>"
          />
          <label className="block text-xs text-slate-500">
            配图 URL（JPG/PNG，公开可访问）
            <input
              value={form.mediaUrl}
              onChange={(e) => patch({ mediaUrl: e.target.value })}
              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <div>
            <p className="text-xs text-slate-500 mb-1">底下的按钮</p>
            {form.buttons.map((btn, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input value={btn.text} onChange={(e) => setButton(index, 'text', e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="按钮文字" />
                <select value={btn.type} onChange={(e) => setButton(index, 'type', e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded text-sm">
                  <option value="url">打开链接</option>
                  <option value="callback">Bot 功能</option>
                </select>
                <input value={btn.data} onChange={(e) => setButton(index, 'data', e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder={btn.type === 'url' ? 'https://' : '例如 energy_rental'} />
              </div>
            ))}
            <button type="button" onClick={addButton} className="text-xs text-cyan-600">+ 加按钮</button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-xs text-slate-500">发给
              <select value={form.targetType} onChange={(e) => patch({ targetType: e.target.value })} className="ml-2 px-2 py-1.5 border border-slate-200 rounded text-sm">
                <option value="all">全部用户</option>
                <option value="group">指定群</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">定时
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => patch({ scheduledAt: e.target.value })} className="ml-2 px-2 py-1.5 border border-slate-200 rounded text-sm" />
            </label>
          </div>
          {form.targetType === 'group' ? (
            <div className="flex flex-wrap gap-2">
              {broadcastGroups.length === 0 ? <p className="text-xs text-slate-400">没有可群发的群，去「连接」打开开关</p> : null}
              {broadcastGroups.map((g) => {
                const on = form.targetGroups.includes(g.chatId);
                return (
                  <button
                    key={g.chatId}
                    type="button"
                    onClick={() => patch({
                      targetGroups: on ? form.targetGroups.filter((id) => id !== g.chatId) : [...form.targetGroups, g.chatId]
                    })}
                    className={`text-xs px-2 py-1 rounded-lg border ${on ? 'bg-cyan-500 text-white border-cyan-500' : 'border-slate-200'}`}
                  >
                    {g.title || g.chatId}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={saveDraft} disabled={loading} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg">{loading ? '...' : '存草稿'}</button>
            <button type="button" onClick={sendNow} disabled={loading} className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg font-bold">{form.scheduledAt ? '到点发送' : '立即发送'}</button>
            {editingId ? (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="px-3 py-1.5 text-sm text-slate-500">新写一条</button>
            ) : null}
          </div>
        </div>
        <PhoneFrame caption="发出去长这样">
          {form.mediaUrl ? <div className="h-24 rounded-lg bg-slate-700 mb-2 text-[10px] text-slate-300 flex items-center justify-center">配图</div> : null}
          <TgBubble html={form.content} />
          {form.buttons.length ? (
            <div className="mt-2 space-y-1">
              {form.buttons.map((btn, i) => (
                <div key={i} className="bg-[#2b5278] text-center text-[12px] py-1.5 rounded-lg">{btn.text || '按钮'}</div>
              ))}
            </div>
          ) : null}
        </PhoneFrame>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-xs text-slate-500">最近发出的</p>
        {(broadcasts || []).map((item) => (
          <div key={item._id} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
              <p className="text-xs text-slate-500">
                {statusText[item.status] || item.status}
                {item.totalUsers ? ` · ${item.sentCount}/${item.totalUsers}` : ''}
                {item.mediaUrl ? ' · 有图' : ''}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => fill(item)} className="text-xs text-cyan-600">接着改</button>
              {item.status === 'draft' ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('确定发送？')) return;
                    const res = await apiFetch(`/api/telegram/broadcasts/${item._id}/send`, { method: 'POST' });
                    const data = await res.json();
                    alert(res.ok
                      ? (data.scheduledAt ? '已预约发送' : `开始发送，约 ${data.totalUsers || 0} 人`)
                      : (data.error || '发送失败'));
                    load();
                  }}
                  className="text-xs text-emerald-600"
                >
                  发送
                </button>
              ) : null}
              <button type="button" onClick={() => remove(item._id)} className="text-xs text-red-500">删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
