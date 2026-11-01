import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../../../api/client';
import {
  ACTION_SCENE,
  ACTION_SLASH,
  CORE_SCENES,
  RECOMMENDED_MENU,
  SCENE_GROUPS,
  varsForScene,
  contentText,
  makeContentPayload,
  sceneMeta,
  welcomeKeyOf,
  buttonsByRow,
  detectBind,
  toMenuButton
} from './telegramStudio';
import { copyTemplates } from './telegramCopyBank';
import { PageHint } from './telegramUi';
import TelegramBindField from './TelegramBindField';
import TelegramSceneEditor from './TelegramSceneEditor';
import TelegramStudioPhone from './TelegramStudioPhone';

const BOARDS = [
  { id: 'menu', label: '主菜单' },
  { id: 'scenes', label: '系统场景' },
  { id: 'pages', label: '自定义页面' }
];

const categoryOf = (key) => {
  const meta = sceneMeta(key);
  if (key?.startsWith('welcome')) return 'welcome';
  if (key?.startsWith('help')) return 'help';
  if (meta?.group === '代付') return 'payment';
  if (meta?.group === '订单') return 'order';
  return ACTION_SCENE[key]?.category || 'custom';
};

const fromContent = (key, map) => {
  const item = map[key];
  const meta = sceneMeta(key);
  return {
    key,
    name: item?.name || meta?.title || key,
    text: contentText(item),
    buttons: item?.buttons || [],
    mediaUrl: item?.content?.mediaUrl || '',
    category: item?.category || categoryOf(key)
  };
};

const boardFromSearch = (search) => {
  const params = new URLSearchParams(search);
  const board = params.get('board');
  if (board === 'menu' || board === 'scenes' || board === 'pages') return board;
  if (params.get('tab') === 'components') return 'pages';
  return 'menu';
};

function MenuEditor({ buttons, onChange, actions, pages, selectedIndex, onSelectIndex }) {
  const rows = buttonsByRow(buttons);
  const patch = (index, next) => {
    const { _index, ...rest } = next;
    onChange(buttons.map((btn, i) => (i === index ? rest : btn)));
  };
  const add = (row) => {
    const col = buttons.filter((btn) => (Number(btn.row) || 0) === row).length;
    onChange([
      ...buttons,
      {
        text: '新按钮',
        type: 'system',
        action: 'payment_usdt',
        row,
        col,
        order: buttons.length,
        enabled: true,
        showInSlash: true
      }
    ]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        用户点底部「菜单」后，这些按钮出现在消息下面。欢迎文案去「系统场景 → 开场」改。
      </p>
      {rows.map(({ row, items }) => (
        <div key={row} className="rounded-lg border border-slate-200 p-2 space-y-2">
          <p className="text-[10px] text-slate-400">第 {row + 1} 行</p>
          {items.map((btn) => {
            const bind = detectBind(btn.type, btn.action);
            const active = selectedIndex === btn._index;
            return (
              <div
                key={btn._index}
                className={`rounded-md p-2 space-y-1.5 ${active ? 'bg-cyan-50' : 'bg-slate-50'}`}
                onClick={() => onSelectIndex(btn._index)}
              >
                <div className="flex gap-1 items-center">
                  <input
                    value={btn.text || ''}
                    onChange={(e) => patch(btn._index, { ...btn, text: e.target.value })}
                    placeholder="按钮文字"
                    className="w-32 shrink-0 bg-white border border-slate-200 rounded px-2 py-1.5 text-xs"
                  />
                  <TelegramBindField
                    kind={bind.kind}
                    value={bind.value}
                    onChange={(kind, value) => patch(btn._index, toMenuButton({ ...btn, text: btn.text }, { kind, value }))}
                    actions={actions}
                    pages={pages}
                  />
                  <button
                    type="button"
                    className="text-xs text-red-400 shrink-0"
                    onClick={() => onChange(buttons.filter((_, i) => i !== btn._index))}
                  >
                    ×
                  </button>
                </div>
                <div className="flex gap-3 text-[11px] text-slate-500">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={btn.enabled !== false}
                      onChange={(e) => patch(btn._index, { ...btn, enabled: e.target.checked })}
                    />
                    启用
                  </label>
                  {bind.kind === 'system' ? (
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={btn.showInSlash !== false}
                        onChange={(e) => patch(btn._index, { ...btn, showInSlash: e.target.checked })}
                      />
                      同步斜杠
                    </label>
                  ) : null}
                </div>
              </div>
            );
          })}
          <button type="button" className="text-[11px] text-slate-400" onClick={() => add(row)}>
            本行 +
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-cyan-600"
        onClick={() => add(rows.length ? rows[rows.length - 1].row + 1 : 0)}
      >
        新一行
      </button>
    </div>
  );
}

export default function TelegramStudioTab() {
  const location = useLocation();
  const [board, setBoard] = useState(() => boardFromSearch(location.search));
  const [menu, setMenu] = useState(null);
  const [contents, setContents] = useState([]);
  const [actions, setActions] = useState([]);
  const [welcomeId, setWelcomeId] = useState('new');
  const [selected, setSelected] = useState({ kind: 'start' });
  const [menuDraft, setMenuDraft] = useState([]);
  const [menuIndex, setMenuIndex] = useState(0);
  const [sceneKey, setSceneKey] = useState('welcome_new_user');
  const [pageKey, setPageKey] = useState('');
  const [contentDraft, setContentDraft] = useState({ key: 'welcome_new_user', name: '', text: '', buttons: [], mediaUrl: '', category: 'welcome' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const byKey = useMemo(() => Object.fromEntries(contents.map((item) => [item.key, item])), [contents]);
  const known = useMemo(() => new Set(CORE_SCENES.map((s) => s.key)), []);
  const pages = contents.filter((item) => !known.has(item.key));
  const systemActions = actions.length
    ? actions
    : Object.entries(ACTION_SLASH).map(([value, meta]) => ({ value, label: meta.description }));
  const templates = useMemo(() => copyTemplates(), []);
  const welcomeKey = welcomeKeyOf(welcomeId);

  const load = async () => {
    const [menuRes, contentRes, actionRes] = await Promise.all([
      apiFetch('/api/telegram/menu'),
      apiFetch('/api/telegram/contents'),
      apiFetch('/api/telegram/menu/system-actions')
    ]);
    const menuData = await menuRes.json();
    const list = await contentRes.json();
    const acts = await actionRes.json();
    const nextContents = Array.isArray(list) ? list : [];
    setMenu(menuData);
    setContents(nextContents);
    setActions(Array.isArray(acts) ? acts : []);
    setMenuDraft(menuData?.buttons || []);
    return Object.fromEntries(nextContents.map((item) => [item.key, item]));
  };

  useEffect(() => {
    load()
      .then((map) => setContentDraft(fromContent('welcome_new_user', map)))
      .catch((err) => console.error('加载工作室失败:', err));
  }, []);

  const upsertContent = async (draft) => {
    const payload = makeContentPayload(
      draft.key,
      draft.name,
      draft.category,
      draft.text,
      (draft.buttons || []).map(({ _index, ...btn }) => btn),
      { mediaUrl: draft.mediaUrl }
    );
    const exists = !!byKey[draft.key]?._id;
    const res = await apiFetch(exists ? `/api/telegram/contents/${draft.key}` : '/api/telegram/contents', {
      method: exists ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '保存文案失败');
    }
  };

  const persistMenu = async (nextButtons) => {
    const res = await apiFetch('/api/telegram/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buttons: nextButtons.map(({ _index, ...btn }) => btn) })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '保存菜单失败');
    }
    const sync = await apiFetch('/api/telegram-commands/sync-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buttons: nextButtons.map(({ _index, ...btn }) => btn) })
    });
    return sync.ok;
  };

  const openScene = (key, map = byKey) => {
    setBoard('scenes');
    setSceneKey(key);
    if (key === 'welcome_new_user') setWelcomeId('new');
    if (key === 'welcome_returning_user') setWelcomeId('returning');
    setContentDraft(fromContent(key, map));
    setSelected(key.startsWith('welcome') ? { kind: 'welcome' } : { kind: 'scene', key });
  };

  const openPage = (key, map = byKey) => {
    setBoard('pages');
    setPageKey(key);
    setContentDraft(fromContent(key, map));
    setSelected({ kind: 'scene', key });
  };

  const onPhoneSelect = (next) => {
    setSelected(next);
    if (next.kind === 'menu') {
      const btn = menuDraft[next.index];
      setMenuIndex(next.index);
      const bind = detectBind(btn?.type, btn?.action);
      if (bind.kind === 'system' && ACTION_SCENE[bind.value]) {
        openScene(ACTION_SCENE[bind.value].key);
        return;
      }
      if (bind.kind === 'page' && bind.value) {
        if (known.has(bind.value)) openScene(bind.value);
        else openPage(bind.value);
        return;
      }
      setBoard('menu');
      return;
    }
    if (next.kind === 'start' || next.kind === 'welcome') {
      if (board === 'menu') return;
      openScene(welcomeKey);
      return;
    }
    const key = next.kind === 'inline' ? next.parentKey : next.key;
    if (!key) return;
    if (known.has(key)) openScene(key);
    else openPage(key);
  };

  const saveMenu = async () => {
    setSaving(true);
    try {
      const synced = await persistMenu(menuDraft);
      setNotice(synced ? '主菜单已保存。用户发 /start 或 /menu 后才会刷新。' : '主菜单已保存，斜杠同步失败（Bot 可能未启动）');
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveContent = async () => {
    if (!contentDraft?.key) return;
    if (board === 'pages' && !String(contentDraft.name || '').trim()) {
      alert('先写页面名称');
      return;
    }
    setSaving(true);
    try {
      await upsertContent(contentDraft);
      const map = await load();
      setContentDraft(fromContent(contentDraft.key, map));
      setNotice('已保存，右侧预览已更新');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyRecommendedMenu = async () => {
    if (!window.confirm('用推荐主菜单覆盖当前按钮（含签到 / 邀请 / 提现）？')) return;
    setSaving(true);
    try {
      const synced = await persistMenu(RECOMMENDED_MENU);
      setMenuDraft(RECOMMENDED_MENU);
      setNotice(synced ? '已套用推荐菜单。用户发 /start 或 /menu 后出现在欢迎消息下面。' : '已套用推荐菜单，斜杠同步失败（Bot 可能未启动）');
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startNewPage = () => {
    const key = `page_${Date.now()}`;
    setBoard('pages');
    setPageKey(key);
    setContentDraft({
      key,
      name: '新页面',
      text: '',
      buttons: [],
      mediaUrl: '',
      category: 'custom',
      isNew: true
    });
    setSelected({ kind: 'scene', key });
  };

  const removePage = async (key) => {
    if (!window.confirm('删除这个自定义页面？菜单里还指着它的按钮会点不动。')) return;
    const res = await apiFetch(`/api/telegram/contents/${key}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '删除失败');
      return;
    }
    const map = await load();
    const next = Object.values(map).find((item) => !known.has(item.key) && item.key !== key);
    if (next) openPage(next.key, map);
    else {
      setPageKey('');
      setContentDraft({ key: '', name: '', text: '', buttons: [], mediaUrl: '', category: 'custom' });
    }
  };

  const switchBoard = (id) => {
    setBoard(id);
    setNotice('');
    if (id === 'scenes') openScene(sceneKey);
    if (id === 'pages') {
      if (pageKey && byKey[pageKey]) openPage(pageKey);
      else if (pages[0]) openPage(pages[0].key);
      else {
        setPageKey('');
        setContentDraft({ key: '', name: '', text: '', buttons: [], mediaUrl: '', category: 'custom' });
      }
    }
    if (id === 'menu') setSelected({ kind: 'menu', index: menuIndex });
  };

  const viewKey = board === 'menu' ? welcomeKey : contentDraft.key || welcomeKey;
  const liveText = board === 'menu' ? contentText(byKey[welcomeKey]) : contentDraft.text;
  const liveButtons = board === 'menu' ? byKey[welcomeKey]?.buttons || [] : contentDraft.buttons;
  const sceneTemplates = templates.filter((item) => {
    const group = sceneMeta(contentDraft.key)?.group;
    if (!group) return true;
    return item.group === group || item.group === '积木';
  });

  if (!menu) {
    return <p className="text-sm text-slate-400 py-12 text-center">加载工作室...</p>;
  }

  return (
    <div>
      <PageHint title="工作室">
        用户聊天框底部常驻只有「菜单」。点它之后，功能按钮以消息弹出。下面「主菜单」改的就是弹出来的那些按钮。系统场景只能改文案和按钮，不能改步骤顺序。
      </PageHint>
      {notice ? <p className="text-xs text-emerald-600 mb-3">{notice}</p> : null}

      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4 w-fit">
        {BOARDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchBoard(item.id)}
            className={`px-3 py-1.5 text-sm rounded-md ${board === item.id ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-500'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {board !== 'menu' ? (
          <div className="w-full xl:w-56 shrink-0 bg-white rounded-lg border border-slate-200 p-2 max-h-[640px] overflow-y-auto">
            {board === 'scenes'
              ? SCENE_GROUPS.map((group) => (
                  <div key={group} className="mb-2">
                    <p className="text-[10px] text-slate-400 px-2 py-1">{group}</p>
                    {CORE_SCENES.filter((item) => item.group === group).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => openScene(item.key)}
                        className={`block w-full text-left px-2 py-1.5 rounded-md text-xs ${
                          sceneKey === item.key ? 'bg-cyan-50 text-cyan-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {item.title}
                        <span className="block text-[10px] font-normal text-slate-400">{item.when}</span>
                      </button>
                    ))}
                  </div>
                ))
              : (
                <>
                  <button
                    type="button"
                    onClick={startNewPage}
                    className="w-full mb-2 px-2 py-1.5 text-xs bg-cyan-500 text-white rounded-md font-bold"
                  >
                    新建页面
                  </button>
                  {pages.length ? (
                    pages.map((item) => (
                      <div key={item.key} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openPage(item.key)}
                          className={`flex-1 text-left px-2 py-1.5 rounded-md text-xs min-w-0 ${
                            pageKey === item.key ? 'bg-cyan-50 text-cyan-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="block truncate">{item.name}</span>
                          <span className="block text-[10px] font-normal text-slate-400 truncate">{item.key}</span>
                        </button>
                        <button type="button" className="text-[11px] text-red-400 shrink-0" onClick={() => removePage(item.key)}>
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 px-2 py-6 text-center">还没有自定义页面</p>
                  )}
                </>
              )}
          </div>
        ) : null}

        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 min-h-[420px] min-w-0">
          {board === 'menu' ? (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">主菜单按钮</p>
                  <p className="text-xs text-slate-500">每个按钮绑定：系统功能 / 自定义页面 / 打开链接</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={applyRecommendedMenu}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    套用推荐菜单
                  </button>
                  <button
                    type="button"
                    onClick={saveMenu}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg font-bold disabled:opacity-50"
                  >
                    {saving ? '保存中' : '保存主菜单'}
                  </button>
                </div>
              </div>
              <MenuEditor
                buttons={menuDraft}
                onChange={setMenuDraft}
                actions={systemActions}
                pages={pages}
                selectedIndex={menuIndex}
                onSelectIndex={setMenuIndex}
              />
            </>
          ) : contentDraft.key ? (
            <TelegramSceneEditor
              textareaId={board === 'pages' ? 'tg-page-text' : 'tg-scene-text'}
              name={contentDraft.name}
              nameLabel={board === 'pages' ? '页面名称' : '场景名称'}
              onName={(name) => setContentDraft({ ...contentDraft, name })}
              keyLabel={contentDraft.key}
              text={contentDraft.text}
              onText={(text) => setContentDraft({ ...contentDraft, text })}
              mediaUrl={contentDraft.mediaUrl}
              onMediaUrl={(mediaUrl) => setContentDraft({ ...contentDraft, mediaUrl })}
              variables={varsForScene(contentDraft.key)}
              buttons={contentDraft.buttons}
              onButtons={(buttons) => setContentDraft({ ...contentDraft, buttons })}
              actions={systemActions}
              pages={pages}
              templates={sceneTemplates}
              onApplyTemplate={(item) =>
                setContentDraft({
                  ...contentDraft,
                  text: item.text || contentDraft.text,
                  buttons: item.buttons?.length ? item.buttons : contentDraft.buttons
                })
              }
              saving={saving}
              onSave={saveContent}
              hint={sceneMeta(contentDraft.key)?.when ? `用户看到的时机：${sceneMeta(contentDraft.key).when}` : '可挂到主菜单，或从别的页面按钮跳过来'}
            />
          ) : (
            <p className="text-sm text-slate-400 py-16 text-center">左边选一项，或新建页面</p>
          )}
        </div>

        <TelegramStudioPhone
          welcomeId={welcomeId}
          onWelcomeId={(id) => {
            setWelcomeId(id);
            if (board === 'scenes') openScene(welcomeKeyOf(id));
          }}
          selected={selected}
          onSelect={onPhoneSelect}
          viewKey={viewKey}
          liveText={liveText}
          liveButtons={liveButtons}
          liveMenu={menuDraft}
          contentsByKey={byKey}
        />
      </div>
    </div>
  );
}
