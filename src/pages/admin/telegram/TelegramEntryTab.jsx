import { useEffect, useState } from 'react';
import { apiFetch } from '../../../api/client';
import { ACTION_SLASH, RECOMMENDED_MENU, buttonsByRow } from './telegramStudio';
import { PageHint, PhoneFrame, Toggle } from './telegramUi';

const emptyButton = (row, col, order) => ({
  text: '新按钮',
  type: 'system',
  action: 'payment_usdt',
  row,
  col,
  order,
  enabled: true,
  showInSlash: true,
  slashCommand: ''
});

export default function TelegramEntryTab() {
  const [menu, setMenu] = useState(null);
  const [actions, setActions] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  const buttons = menu?.buttons || [];
  const current = buttons[selected] || null;
  const rows = buttonsByRow(buttons);

  const load = async () => {
    const [menuRes, actionRes] = await Promise.all([
      apiFetch('/api/telegram/menu'),
      apiFetch('/api/telegram/menu/system-actions')
    ]);
    setMenu(await menuRes.json());
    setActions(await actionRes.json());
  };

  useEffect(() => {
    load().catch((err) => console.error('加载入口失败:', err));
  }, []);

  const patchButton = (index, patch) => {
    const next = buttons.map((btn, i) => (i === index ? { ...btn, ...patch } : btn));
    setMenu({ ...menu, buttons: next });
  };

  const addToRow = (row) => {
    const col = buttons.filter((b) => b.row === row).length;
    const next = [...buttons, emptyButton(row, col, buttons.length)];
    setMenu({ ...menu, buttons: next });
    setSelected(next.length - 1);
  };

  const addRow = () => {
    const row = rows.length ? rows[rows.length - 1].row + 1 : 0;
    addToRow(row);
  };

  const removeButton = (index) => {
    const next = buttons.filter((_, i) => i !== index).map((btn, i) => ({ ...btn, order: i }));
    setMenu({ ...menu, buttons: next });
    setSelected(Math.max(0, index - 1));
  };

  const save = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/telegram/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buttons })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '保存失败');
        return;
      }
      const sync = await apiFetch('/api/telegram-commands/sync-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buttons })
      });
      const synced = await sync.json();
      setMenu(await res.json());
      alert(sync.ok ? `入口已保存，斜杠菜单 ${synced.count || 0} 条` : '入口已保存，斜杠同步失败（Bot 可能未启动）');
    } catch (err) {
      alert('保存失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!confirm('恢复推荐入口：代付 / 能量 / 闪兑 / 订单 / 工单 / 账户 / 帮助？')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/telegram/menu/reset', { method: 'POST' });
      const data = await res.json();
      setMenu(data);
      setSelected(0);
      await apiFetch('/api/telegram-commands/sync-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buttons: data.buttons || RECOMMENDED_MENU })
      });
    } finally {
      setLoading(false);
    }
  };

  const slashPreview = buttons
    .filter((btn) => btn.enabled !== false && btn.showInSlash !== false && btn.type !== 'url')
    .map((btn) => ACTION_SLASH[btn.action]?.command || String(btn.slashCommand || '').replace(/^\//, ''))
    .filter(Boolean);

  if (!menu) {
    return <p className="text-sm text-slate-400 py-12 text-center">加载入口...</p>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <PageHint title="入口">
          用户打开 Bot 后点这些按钮。勾选「斜杠菜单」的，会同时出现在输入 / 时。没有能量和闪兑就点「推荐布局」。签到、邀请、提现目前只在网页。
        </PageHint>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={reset} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">推荐布局</button>
          <button type="button" onClick={save} disabled={loading} className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 disabled:opacity-50">
            {loading ? '保存中' : '保存入口'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <PhoneFrame caption="用户看到的键盘">
          <p className="text-[11px] text-slate-400 mb-3">选择一项服务</p>
          <div className="space-y-1.5">
            {rows.map(({ row, items }) => (
              <div key={row} className="flex gap-1.5">
                {items.map((btn) => (
                  <button
                    key={btn._index}
                    type="button"
                    onClick={() => setSelected(btn._index)}
                    className={`flex-1 text-[12px] py-2 rounded-lg ${selected === btn._index ? 'bg-[#5288c1] text-white' : 'bg-[#2b5278] text-[#e4edf5]'} ${btn.enabled === false ? 'opacity-40' : ''}`}
                  >
                    {btn.text || '空'}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {rows.map(({ row }) => (
              <button key={row} type="button" onClick={() => addToRow(row)} className="text-[10px] text-slate-400 hover:text-white">本行+</button>
            ))}
            <button type="button" onClick={addRow} className="text-[10px] text-slate-400 hover:text-white">新一行</button>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700">
            <p className="text-[10px] text-slate-500 mb-1">输入 / 时</p>
            <div className="flex flex-wrap gap-1">
              {['start', 'menu', ...slashPreview].filter((v, i, a) => a.indexOf(v) === i).map((cmd) => (
                <span key={cmd} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">/{cmd}</span>
              ))}
            </div>
          </div>
        </PhoneFrame>

        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 min-h-[340px]">
          {!current ? (
            <p className="text-sm text-slate-400">点左侧按钮，或新增一行</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">这个按钮</p>
                <button type="button" onClick={() => removeButton(selected)} className="text-xs text-red-500 hover:underline">删掉</button>
              </div>
              <label className="block text-xs text-slate-500">
                按钮文字
                <input
                  value={current.text || ''}
                  onChange={(e) => patchButton(selected, { text: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-slate-500">
                点下去做什么
                <select
                  value={current.type === 'url' ? 'url' : current.action}
                  onChange={(e) => {
                    if (e.target.value === 'url') {
                      patchButton(selected, { type: 'url', action: '', showInSlash: false });
                    } else {
                      patchButton(selected, { type: 'system', action: e.target.value, showInSlash: true });
                    }
                  }}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  {(actions.length ? actions : Object.keys(ACTION_SLASH).map((value) => ({ value, label: value }))).map((item) => (
                    <option key={item.value} value={item.value}>{item.icon ? `${item.icon} ` : ''}{item.label || item.value}</option>
                  ))}
                  {current.type !== 'url' && current.action && !(actions || []).some((item) => item.value === current.action) && !ACTION_SLASH[current.action] ? (
                    <option value={current.action}>{current.action}</option>
                  ) : null}
                  <option value="url">打开链接</option>
                </select>
              </label>
              {current.type === 'url' ? (
                <label className="block text-xs text-slate-500">
                  链接
                  <input
                    value={current.action || ''}
                    onChange={(e) => patchButton(selected, { action: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="https://"
                  />
                </label>
              ) : null}
              <div className="flex flex-wrap gap-4 pt-1">
                <Toggle checked={current.enabled !== false} onChange={(v) => patchButton(selected, { enabled: v })} label="显示" />
                {current.type !== 'url' ? (
                  <Toggle checked={current.showInSlash !== false} onChange={(v) => patchButton(selected, { showInSlash: v })} label={`斜杠菜单 /${ACTION_SLASH[current.action]?.command || '自定义'}`} />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
