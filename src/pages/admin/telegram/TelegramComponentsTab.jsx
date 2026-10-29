import { useEffect, useState } from 'react';
import { apiFetch } from '../../../api/client';
import { CORE_SCENES, DEFAULT_VARS, contentText, makeContentPayload } from './telegramStudio';
import { PageHint } from './telegramUi';
import TelegramSceneEditor from './TelegramSceneEditor';

const knownKeys = new Set(CORE_SCENES.map((s) => s.key));

const isComponent = (item) => !knownKeys.has(item.key);

export default function TelegramComponentsTab() {
  const [contents, setContents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await apiFetch('/api/telegram/contents');
    const data = await res.json();
    setContents(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load().catch((err) => console.error('加载组件失败:', err));
  }, []);

  const list = contents.filter(isComponent).filter((item) => {
    if (filter === 'on') return item.enabled !== false;
    if (filter === 'off') return item.enabled === false;
    return true;
  });

  const openNew = () => {
    const key = `comp_${Date.now()}`;
    setEditing({
      key,
      name: '新组件',
      category: 'custom',
      text: '',
      buttons: [],
      buttonType: 'none',
      isNew: true
    });
    setStep(1);
  };

  const openItem = (item) => {
    setEditing({
      key: item.key,
      name: item.name,
      category: 'custom',
      text: contentText(item),
      buttons: item.buttons || [],
      buttonType: (item.buttons || []).length ? 'inline' : 'none',
      isNew: false
    });
    setStep(1);
  };

  const save = async () => {
    if (!editing) return;
    if (!String(editing.name || '').trim()) {
      alert('先写组件名称');
      return;
    }
    setSaving(true);
    try {
      const payload = makeContentPayload(
        editing.key,
        editing.name.trim(),
        'custom',
        editing.text,
        editing.buttonType === 'none' ? [] : editing.buttons
      );
      const exists = !!contents.find((item) => item.key === editing.key)?._id;
      const res = await apiFetch(exists ? `/api/telegram/contents/${editing.key}` : '/api/telegram/contents', {
        method: exists ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '保存失败');
        return;
      }
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!confirm(`删除组件「${item.name}」？可视化配置里引用它的按钮会失效。`)) return;
    const res = await apiFetch(`/api/telegram/contents/${item.key}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '删除失败');
      return;
    }
    if (editing?.key === item.key) setEditing(null);
    load();
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <PageHint title="自定义组件">
          可复用的积木。保存后会出现在「可视化配置」右侧组件库：写文案时点一下插入内容，关联按钮时点一下变成消息按钮。
        </PageHint>
        <button type="button" onClick={openNew} className="shrink-0 px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg font-bold">
          新建组件
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: 'all', label: '全部' },
          { id: 'on', label: '已启用' },
          { id: 'off', label: '未启用' }
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${filter === item.id ? 'bg-cyan-500 text-white border-cyan-500' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-2">
          {list.length ? (
            list.map((item) => (
              <div key={item.key} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-2">
                <button type="button" onClick={() => openItem(item)} className="text-left min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.key}</p>
                  {contentText(item) ? (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 whitespace-pre-wrap">
                      {contentText(item).replace(/<[^>]+>/g, '')}
                    </p>
                  ) : null}
                </button>
                <button type="button" onClick={() => remove(item)} className="text-xs text-red-500 shrink-0">
                  删除
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center border border-dashed border-slate-200 rounded-xl">还没有组件</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[360px]">
          {!editing ? (
            <p className="text-sm text-slate-400 py-16 text-center">点左侧一项，或新建</p>
          ) : (
            <TelegramSceneEditor
              textareaId="tg-comp-text"
              name={editing.name}
              nameLabel="组件名称"
              onName={(name) => setEditing({ ...editing, name })}
              text={editing.text}
              onText={(text) => setEditing({ ...editing, text })}
              variables={DEFAULT_VARS}
              step={step}
              onStep={setStep}
              buttonType={editing.buttonType}
              onButtonType={(buttonType) => setEditing({ ...editing, buttonType })}
              allowTypes={['none', 'inline']}
              inlineButtons={editing.buttons}
              onInlineButtons={(buttons) => setEditing({ ...editing, buttons })}
              saving={saving}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
