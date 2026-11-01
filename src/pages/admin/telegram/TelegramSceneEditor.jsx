import { DEFAULT_VARS, buttonsByRow, detectBind, toInlineButton } from './telegramStudio';
import { HtmlBar } from './telegramUi';
import TelegramBindField from './TelegramBindField';

export default function TelegramSceneEditor({
  textareaId = 'tg-scene-text',
  name,
  nameLabel = '名称',
  onName,
  nameLocked = false,
  keyLabel,
  text,
  onText,
  mediaUrl,
  onMediaUrl,
  variables = DEFAULT_VARS,
  buttons = [],
  onButtons,
  actions = [],
  pages = [],
  templates = [],
  onApplyTemplate,
  saving,
  onSave,
  onCancel,
  saveLabel = '保存',
  hint
}) {
  const insertVar = (key) => {
    const token = `{{${key}}}`;
    const el = document.getElementById(textareaId);
    if (!el || !onText) {
      onText?.((text || '') + token);
      return;
    }
    const start = el.selectionStart ?? (text || '').length;
    const end = el.selectionEnd ?? start;
    onText((text || '').slice(0, start) + token + (text || '').slice(end));
  };

  const patchButton = (index, next) => {
    const { _index, ...rest } = next;
    onButtons?.(buttons.map((btn, i) => (i === index ? rest : btn)));
  };

  const addButton = (row) => {
    const targetRow = Number.isFinite(row) ? row : buttons.length ? Math.max(...buttons.map((btn) => Number(btn.row) || 0)) : 0;
    const col = buttons.filter((btn) => (Number(btn.row) || 0) === targetRow).length;
    onButtons?.([
      ...buttons,
      { text: '新按钮', type: 'callback', data: 'payment_usdt', row: targetRow, col }
    ]);
  };

  const rows = buttonsByRow(buttons);

  return (
    <div className="space-y-4">
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}

      {onName ? (
        <label className="block text-xs text-slate-500">
          {nameLabel}
          <input
            value={name || ''}
            onChange={(e) => onName(e.target.value)}
            disabled={nameLocked}
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:text-slate-400"
          />
        </label>
      ) : null}

      {keyLabel ? <p className="text-[11px] text-slate-400 -mt-2">标识 {keyLabel}</p> : null}

      {templates.length && onApplyTemplate ? (
        <label className="block text-xs text-slate-500">
          套用话术
          <select
            defaultValue=""
            onChange={(e) => {
              const item = templates.find((tpl) => tpl.key === e.target.value);
              if (item) onApplyTemplate(item);
              e.target.value = '';
            }}
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">不套用，继续改下面的文案</option>
            {templates.map((item) => (
              <option key={item.key} value={item.key}>
                {item.group ? `${item.group} · ` : ''}
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div>
        <p className="text-xs text-slate-500 mb-1">消息正文</p>
        <HtmlBar textareaId={textareaId} value={text || ''} onChange={onText} />
        <textarea
          id={textareaId}
          value={text || ''}
          onChange={(e) => onText(e.target.value)}
          rows={9}
          className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm"
          placeholder="用户点进来后看到的话，支持 HTML 和 {{变量}}"
        />
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-1">发送时会填的变量（点一下插入）</p>
        <div className="flex flex-wrap gap-1">
          {variables.filter((item) => item.live !== false).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => insertVar(item.key)}
              className="text-[11px] px-2 py-1 rounded bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
            >
              {item.label || item.key}
            </button>
          ))}
        </div>
        {variables.some((item) => item.live === false) ? (
          <details className="mt-2">
            <summary className="text-[11px] text-slate-400 cursor-pointer">其他场景的变量（写了不会填）</summary>
            <div className="flex flex-wrap gap-1 mt-1">
              {variables.filter((item) => item.live === false).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => insertVar(item.key)}
                  className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  {item.label || item.key}
                </button>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {onMediaUrl ? (
        <label className="block text-xs text-slate-500">
          配图链接（可空）
          <input
            value={mediaUrl || ''}
            onChange={(e) => onMediaUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
      ) : null}

      {onButtons ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">这条消息下面的按钮</p>
          {rows.map(({ row, items }) => (
            <div key={row} className="space-y-1.5 rounded-lg border border-slate-200 p-2">
              <p className="text-[10px] text-slate-400">第 {row + 1} 行</p>
              {items.map((btn) => {
                const bind = detectBind(btn.type, btn.data || btn.action);
                return (
                  <div key={btn._index} className="flex gap-1 items-center">
                    <input
                      value={btn.text || ''}
                      onChange={(e) => patchButton(btn._index, { ...btn, text: e.target.value })}
                      placeholder="按钮文字"
                      className="w-28 shrink-0 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs"
                    />
                    <TelegramBindField
                      kind={bind.kind}
                      value={bind.value}
                      onChange={(kind, value) => patchButton(btn._index, toInlineButton({ ...btn, text: btn.text }, { kind, value }))}
                      actions={actions}
                      pages={pages}
                    />
                    <button
                      type="button"
                      className="text-xs text-red-400 shrink-0"
                      onClick={() => onButtons(buttons.filter((_, i) => i !== btn._index))}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              <button type="button" className="text-[11px] text-slate-400" onClick={() => addButton(row)}>
                本行 +
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs text-cyan-600"
            onClick={() => addButton(rows.length ? rows[rows.length - 1].row + 1 : 0)}
          >
            新一行按钮
          </button>
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg">
            取消
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {saving ? '保存中' : saveLabel}
        </button>
      </div>
    </div>
  );
}
