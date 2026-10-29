import { useEffect, useState } from 'react';
import { apiFetch } from '../../../api/client';
import TelegramContentEditor from '../../../components/TelegramContentEditor';
import { CORE_SCENES, ENERGY_FEED_SAMPLE } from './telegramStudio';
import { PageHint } from './telegramUi';

const groups = ['开场', '代付', '订单'];

export default function TelegramCopyTab() {
  const [contents, setContents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState('开场');

  const load = async () => {
    const res = await apiFetch('/api/telegram/contents');
    const data = await res.json();
    setContents(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load().catch((err) => console.error('加载文案失败:', err));
  }, []);

  const byKey = Object.fromEntries(contents.map((item) => [item.key, item]));
  const known = new Set(CORE_SCENES.map((s) => s.key));
  const extras = contents.filter((item) => !known.has(item.key));
  const scenes = CORE_SCENES.filter((s) => s.group === group);

  const openScene = (scene) => {
    setEditing(byKey[scene.key] || {
      key: scene.key,
      name: scene.title,
      category: scene.group === '代付' ? 'payment' : scene.group === '订单' ? 'order' : scene.key.startsWith('help') ? 'help' : 'welcome',
      content: { type: 'text', text: '', mediaUrl: '', caption: '', parseMode: 'HTML' },
      features: { copyable: false, copyText: '', highlight: [], links: [], emojis: [] },
      buttons: [],
      variables: [],
      triggers: [],
      enabled: true
    });
    setOpen(true);
  };

  const saveContent = async (formData) => {
    const exists = !!byKey[formData.key]?._id;
    const url = exists ? `/api/telegram/contents/${formData.key}` : '/api/telegram/contents';
    const res = await apiFetch(url, {
      method: exists ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '保存失败');
      return;
    }
    setOpen(false);
    setEditing(null);
    load();
  };

  return (
    <div>
      <PageHint title="文案">
        按用户碰到的场景改话。能量 / 闪兑过程还写在流程里，这里改不了。群公告格式固定，地址自动打码。
      </PageHint>

      <div className="flex gap-2 mb-4">
        {groups.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setGroup(name)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${group === name ? 'bg-cyan-500 text-white border-cyan-500' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {group === '开场' ? (
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-3">
            <p className="text-sm font-bold text-slate-800">能量租赁群公告</p>
            <p className="text-xs text-slate-500 mt-1">租成功自动推群，格式固定</p>
            <pre className="mt-2 text-[11px] leading-5 bg-[#17212b] text-[#e4edf5] rounded-lg px-3 py-2 whitespace-pre-wrap">{ENERGY_FEED_SAMPLE}</pre>
          </div>
        ) : null}

        {scenes.map((scene) => {
          const item = byKey[scene.key];
          return (
            <button
              key={scene.key}
              type="button"
              onClick={() => openScene(scene)}
              className="text-left border border-slate-200 rounded-xl p-3 hover:border-cyan-400 bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-slate-800">{scene.title}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item?._id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {item?._id ? '已写' : '未写'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{scene.when}</p>
              {item?.content?.text ? (
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 whitespace-pre-wrap">{item.content.text.replace(/<[^>]+>/g, '')}</p>
              ) : null}
            </button>
          );
        })}
      </div>

      {extras.length ? (
        <div className="mt-6">
          <p className="text-xs text-slate-500 mb-2">其他自定义</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {extras.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => { setEditing(item); setOpen(true); }}
                className="text-left border border-slate-200 rounded-xl p-3 hover:border-cyan-400 bg-white"
              >
                <p className="text-sm font-bold text-slate-800">{item.name || item.key}</p>
                <p className="text-xs text-slate-400 mt-1">{item.key}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <p className="font-bold">{editing?._id ? '改这段话' : '写这段话'}</p>
              <button type="button" className="text-sm text-slate-500" onClick={() => { setOpen(false); setEditing(null); }}>关闭</button>
            </div>
            <div className="p-4">
              <TelegramContentEditor
                content={editing}
                onSave={saveContent}
                onCancel={() => { setOpen(false); setEditing(null); }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
