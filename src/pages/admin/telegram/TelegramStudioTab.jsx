import { useEffect, useState } from 'react';
import { apiFetch } from '../../../api/client';
import {
  ACTION_SCENE,
  ACTION_SLASH,
  CORE_SCENES,
  varsForScene,
  contentText,
  makeContentPayload,
  sceneMeta,
  welcomeKeyOf
} from './telegramStudio';
import { PageHint } from './telegramUi';
import TelegramSceneEditor from './TelegramSceneEditor';
import TelegramStudioPhone from './TelegramStudioPhone';
import TelegramStudioLibrary from './TelegramStudioLibrary';

const categoryOf = (key) => {
  const meta = sceneMeta(key);
  if (key?.startsWith('welcome')) return 'welcome';
  if (key?.startsWith('help')) return 'help';
  if (meta?.group === '代付') return 'payment';
  if (meta?.group === '订单') return 'order';
  return ACTION_SCENE[key]?.category || 'custom';
};

export default function TelegramStudioTab() {
  const [menu, setMenu] = useState(null);
  const [contents, setContents] = useState([]);
  const [actions, setActions] = useState([]);
  const [welcomeId, setWelcomeId] = useState('new');
  const [selected, setSelected] = useState({ kind: 'start' });
  const [mode, setMode] = useState('review');
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const [menuRes, contentRes, actionRes] = await Promise.all([
      apiFetch('/api/telegram/menu'),
      apiFetch('/api/telegram/contents'),
      apiFetch('/api/telegram/menu/system-actions')
    ]);
    setMenu(await menuRes.json());
    const list = await contentRes.json();
    setContents(Array.isArray(list) ? list : []);
    const acts = await actionRes.json();
    setActions(Array.isArray(acts) ? acts : []);
  };

  useEffect(() => {
    load().catch((err) => console.error('加载可视化配置失败:', err));
  }, []);

  const byKey = Object.fromEntries(contents.map((item) => [item.key, item]));
  const buttons = menu?.buttons || [];
  const welcomeKey = welcomeKeyOf(welcomeId);
  const known = new Set(CORE_SCENES.map((s) => s.key));
  const components = contents.filter((item) => !known.has(item.key));

  const viewKey = (() => {
    if (selected.kind === 'menu') return ACTION_SCENE[buttons[selected.index]?.action]?.key || welcomeKey;
    if (selected.kind === 'scene') return selected.key;
    if (selected.kind === 'inline') return selected.parentKey;
    return welcomeKey;
  })();

  const viewItem = byKey[viewKey];
  const viewText = contentText(viewItem);
  const inlineButtons = viewItem?.buttons || [];

  const select = (next) => {
    setSelected(next);
    setMode('review');
    setStep(1);
    setDraft(null);
  };

  const title = (() => {
    if (selected.kind === 'start') return '/start';
    if (selected.kind === 'welcome') return welcomeId === 'new' ? '新用户欢迎' : '老用户欢迎';
    if (selected.kind === 'menu') return buttons[selected.index]?.text || '底部按钮';
    if (selected.kind === 'inline') return inlineButtons[selected.index]?.text || '消息按钮';
    return sceneMeta(selected.key)?.title || byKey[selected.key]?.name || selected.key;
  })();

  const subtitle = (() => {
    if (selected.kind === 'start' || selected.kind === 'welcome') return '用户第一次打开或再次进来';
    if (selected.kind === 'menu') return '底部菜单点下去之后的回复';
    if (selected.kind === 'inline') return '这条消息下面的按钮';
    return sceneMeta(selected.key)?.when || selected.key;
  })();

  const beginEdit = () => {
    if (selected.kind === 'start' || selected.kind === 'welcome') {
      const item = byKey[welcomeKey];
      setDraft({
        name: item?.name || title,
        text: contentText(item),
        inlineButtons: item?.buttons || [],
        menuButtons: buttons,
        buttonType: (item?.buttons || []).length ? 'inline' : 'bottom',
        systemAction: '',
        contentKey: welcomeKey,
        category: 'welcome'
      });
    } else if (selected.kind === 'menu') {
      const btn = buttons[selected.index];
      const key = ACTION_SCENE[btn?.action]?.key || btn?.action;
      const item = byKey[key];
      setDraft({
        name: btn?.text || '',
        text: contentText(item),
        inlineButtons: item?.buttons || [],
        menuButtons: buttons,
        buttonType: btn?.type === 'url' ? 'none' : 'system',
        systemAction: btn?.action || '',
        contentKey: key,
        category: ACTION_SCENE[btn?.action]?.category || 'custom'
      });
    } else {
      const key = selected.kind === 'inline' ? selected.parentKey : selected.key;
      const item = byKey[key];
      setDraft({
        name: item?.name || sceneMeta(key)?.title || key,
        text: contentText(item),
        inlineButtons: item?.buttons || [],
        menuButtons: buttons,
        buttonType: (item?.buttons || []).length ? 'inline' : 'none',
        systemAction: '',
        contentKey: key,
        category: item?.category || categoryOf(key)
      });
    }
    setMode('edit');
    setStep(selected.kind === 'inline' ? 2 : 1);
  };

  const upsertContent = async (key, name, category, text, nextButtons) => {
    const payload = makeContentPayload(key, name, category, text, nextButtons);
    const exists = !!byKey[key]?._id;
    const res = await apiFetch(exists ? `/api/telegram/contents/${key}` : '/api/telegram/contents', {
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
      body: JSON.stringify({ buttons: nextButtons })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '保存入口失败');
    }
    const sync = await apiFetch('/api/telegram-commands/sync-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buttons: nextButtons })
    });
    return sync.ok;
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      let synced = true;
      if (selected.kind === 'start' || selected.kind === 'welcome') {
        const keep = draft.buttonType === 'inline' ? draft.inlineButtons : byKey[draft.contentKey]?.buttons || [];
        await upsertContent(draft.contentKey, draft.name, 'welcome', draft.text, keep);
        if (draft.buttonType === 'bottom') synced = await persistMenu(draft.menuButtons);
      } else if (selected.kind === 'menu') {
        const action = draft.buttonType === 'system' ? draft.systemAction : buttons[selected.index]?.action;
        const key = ACTION_SCENE[action]?.key || draft.contentKey;
        const keep = draft.buttonType === 'inline' ? draft.inlineButtons : byKey[key]?.buttons || [];
        await upsertContent(key, ACTION_SCENE[action]?.title || draft.name, ACTION_SCENE[action]?.category || 'custom', draft.text, keep);
        const nextButtons = buttons.map((btn, i) =>
          i === selected.index
            ? { ...btn, text: draft.name, type: draft.buttonType === 'system' ? 'system' : btn.type, action }
            : btn
        );
        synced = await persistMenu(nextButtons);
      } else {
        const keep = draft.buttonType === 'none' ? [] : draft.inlineButtons;
        await upsertContent(draft.contentKey, draft.name, draft.category, draft.text, keep);
      }
      setNotice(synced ? '已保存，手机预览已更新' : '已保存，斜杠菜单同步失败（Bot 可能未启动）');
      await load();
      setMode('review');
      setStep(1);
      setDraft(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyCopy = (item, append = false) => {
    const text = item.text || '';
    const nextButtons = item.buttons || [];
    if (mode === 'edit' && draft) {
      setDraft({
        ...draft,
        text: append ? `${draft.text || ''}${draft.text ? '\n' : ''}${text}` : text,
        inlineButtons: append || !nextButtons.length ? draft.inlineButtons : nextButtons,
        buttonType: !append && nextButtons.length ? 'inline' : draft.buttonType
      });
      setNotice(append ? `已插入「${item.name}」` : `已套用「${item.name}」，保存后生效`);
      return;
    }
    const jumpKey = item.snippet || item.style ? viewKey : item.key;
    const known = CORE_SCENES.some((s) => s.key === jumpKey);
    if (!item.snippet && known) {
      if (jumpKey === 'welcome_new_user') {
        setWelcomeId('new');
        setSelected({ kind: 'welcome' });
      } else if (jumpKey === 'welcome_returning_user') {
        setWelcomeId('returning');
        setSelected({ kind: 'welcome' });
      } else {
        setSelected({ kind: 'scene', key: jumpKey });
      }
    }
    const targetKey = known ? jumpKey : viewKey;
    const current = byKey[targetKey];
    setDraft({
      name: item.snippet ? current?.name || title : item.name,
      text: append ? `${contentText(current)}${contentText(current) ? '\n' : ''}${text}` : text,
      inlineButtons: append || !nextButtons.length ? current?.buttons || [] : nextButtons,
      menuButtons: buttons,
      buttonType: (!append && nextButtons.length) || (current?.buttons || []).length ? 'inline' : 'none',
      systemAction: '',
      contentKey: targetKey,
      category: categoryOf(targetKey)
    });
    setMode('edit');
    setStep(1);
    setNotice(append ? `已插入「${item.name}」` : `已套用「${item.name}」，改完点保存`);
  };

  const onPick = (type, item) => {
    if (type === 'template' || type === 'snippet') {
      applyCopy(item, type === 'snippet');
      return;
    }
    if (type === 'scene') {
      select({ kind: 'scene', key: item.key });
      return;
    }
    if (type === 'action') {
      const key = ACTION_SCENE[item.value]?.key;
      if (mode === 'edit' && draft && step === 2 && draft.buttonType === 'system') {
        setDraft({ ...draft, systemAction: item.value, contentKey: key || draft.contentKey });
        return;
      }
      if (mode === 'edit' && draft && step === 2) {
        setDraft({
          ...draft,
          buttonType: 'inline',
          inlineButtons: [
            ...draft.inlineButtons,
            { text: item.label, type: 'callback', data: item.value, row: 0, col: draft.inlineButtons.length }
          ]
        });
        return;
      }
      if (key) select({ kind: 'scene', key });
      return;
    }
    if (type === 'component') {
      if (mode === 'edit' && draft && step === 1) {
        setDraft({ ...draft, text: `${draft.text || ''}${draft.text ? '\n' : ''}${contentText(item)}` });
        return;
      }
      if (mode === 'edit' && draft && step === 2) {
        setDraft({
          ...draft,
          buttonType: draft.buttonType === 'none' ? 'inline' : draft.buttonType,
          inlineButtons: [...draft.inlineButtons, { text: item.name, type: 'callback', data: item.key, row: 0, col: 0 }]
        });
        return;
      }
      select({ kind: 'scene', key: item.key });
      return;
    }
    if (type === 'variable' && mode === 'edit' && draft && step === 1) {
      const token = `{{${item.key}}}`;
      const el = document.getElementById('tg-scene-text');
      const text = draft.text || '';
      if (!el) {
        setDraft({ ...draft, text: text + token });
        return;
      }
      const start = el.selectionStart ?? text.length;
      const end = el.selectionEnd ?? start;
      setDraft({ ...draft, text: text.slice(0, start) + token + text.slice(end) });
    }
  };

  const allowTypes =
    selected.kind === 'start' || selected.kind === 'welcome'
      ? ['none', 'bottom', 'inline']
      : selected.kind === 'menu'
        ? ['system', 'inline']
        : ['none', 'inline'];

  if (!menu) {
    return <p className="text-sm text-slate-400 py-12 text-center">加载可视化配置...</p>;
  }

  return (
    <div>
      <PageHint title="可视化配置">
        右边手机是真聊天预览：点底部菜单会发出用户消息，机器人再回；中间改的字马上出现在气泡里。
      </PageHint>
      {notice ? <p className="text-xs text-emerald-600 mb-3">{notice}</p> : null}

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 min-h-[420px] min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] text-slate-400">当前选中</p>
              <p className="text-sm font-bold text-slate-800">{title}</p>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
            {mode === 'review' ? (
              <button type="button" onClick={beginEdit} className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg font-bold">
                编辑
              </button>
            ) : null}
          </div>

          {mode !== 'edit' || !draft ? (
            <div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm whitespace-pre-wrap min-h-[120px]">
                {viewText || '（还没有文字）'}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                消息按钮 {inlineButtons.length} 个 · 底部菜单 {buttons.length} 个
              </p>
            </div>
          ) : (
            <TelegramSceneEditor
              name={selected.kind === 'menu' ? draft.name : undefined}
              onName={selected.kind === 'menu' ? (name) => setDraft({ ...draft, name }) : undefined}
              text={draft.text}
              onText={(text) => setDraft({ ...draft, text })}
              variables={varsForScene(draft.contentKey || viewKey)}
              step={step}
              onStep={setStep}
              buttonType={draft.buttonType}
              onButtonType={(buttonType) => setDraft({ ...draft, buttonType })}
              allowTypes={allowTypes}
              inlineButtons={draft.inlineButtons}
              onInlineButtons={(inlineButtons) => setDraft({ ...draft, inlineButtons })}
              menuButtons={draft.menuButtons}
              onMenuButtons={(menuButtons) => setDraft({ ...draft, menuButtons })}
              actions={actions.length ? actions : Object.entries(ACTION_SLASH).map(([value, meta]) => ({ value, label: meta.description }))}
              library={components}
              systemAction={draft.systemAction}
              onSystemAction={(systemAction) => {
                const key = ACTION_SCENE[systemAction]?.key || draft.contentKey;
                const item = byKey[key];
                setDraft({
                  ...draft,
                  systemAction,
                  contentKey: key,
                  text: item ? contentText(item) : draft.text,
                  inlineButtons: item?.buttons || [],
                  category: ACTION_SCENE[systemAction]?.category || draft.category
                });
              }}
              saving={saving}
              onSave={save}
              onCancel={() => {
                setMode('review');
                setDraft(null);
                setStep(1);
              }}
            />
          )}
        </div>

        <TelegramStudioLibrary
          actions={actions.length ? actions : Object.entries(ACTION_SLASH).map(([value, meta]) => ({ value, label: meta.description }))}
          components={components}
          variables={varsForScene(draft?.contentKey || viewKey)}
          onPick={onPick}
        />

        <TelegramStudioPhone
          welcomeId={welcomeId}
          onWelcomeId={setWelcomeId}
          selected={selected}
          onSelect={select}
          viewKey={viewKey}
          liveText={draft?.text ?? viewText}
          liveButtons={draft?.inlineButtons ?? inlineButtons}
          liveMenu={draft?.menuButtons ?? buttons}
          contentsByKey={byKey}
        />
      </div>
    </div>
  );
}
