import { ACTION_SLASH, DEFAULT_VARS, buttonsByRow } from './telegramStudio';
import { HtmlBar, StepTabs } from './telegramUi';

const TYPE_OPTIONS = [
  { value: 'none', label: '无按钮' },
  { value: 'bottom', label: '底部菜单' },
  { value: 'inline', label: '消息下方' },
  { value: 'system', label: '系统功能' }
];

export default function TelegramSceneEditor({
  textareaId = 'tg-scene-text',
  name,
  nameLabel = '按钮名称',
  onName,
  text,
  onText,
  variables = DEFAULT_VARS,
  step,
  onStep,
  buttonType,
  onButtonType,
  allowTypes = ['none', 'inline'],
  inlineButtons = [],
  onInlineButtons,
  menuButtons = [],
  onMenuButtons,
  actions = [],
  library = [],
  systemAction = '',
  onSystemAction,
  saving,
  onSave,
  onCancel
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

  const patchInline = (index, patch) => {
    onInlineButtons?.(inlineButtons.map((btn, i) => (i === index ? { ...btn, ...patch } : btn)));
  };

  const addInline = (btn) => {
    onInlineButtons?.([
      ...inlineButtons,
      btn || { text: '新按钮', type: 'callback', data: '', row: 0, col: inlineButtons.length }
    ]);
  };

  const rows = buttonsByRow(menuButtons);
  const addMenu = (row) => {
    const col = menuButtons.filter((b) => b.row === row).length;
    onMenuButtons?.([
      ...menuButtons,
      {
        text: '新按钮',
        type: 'system',
        action: 'payment_usdt',
        row,
        col,
        order: menuButtons.length,
        enabled: true,
        showInSlash: true
      }
    ]);
  };

  return (
    <div className="space-y-3">
      {onName ? (
        <label className="block text-xs text-slate-500">
          {nameLabel}
          <input
            value={name || ''}
            onChange={(e) => onName(e.target.value)}
            className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </label>
      ) : null}

      <StepTabs step={step} onChange={onStep} />

      {step === 1 ? (
        <>
          <HtmlBar textareaId={textareaId} value={text || ''} onChange={onText} />
          <textarea
            id={textareaId}
            value={text || ''}
            onChange={(e) => onText(e.target.value)}
            rows={10}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm"
            placeholder="点下去之后机器人发的话，支持 HTML 和 {{变量}}"
          />
          <div>
            <p className="text-xs text-slate-500 mb-1">这条消息发送时会填（点插入）</p>
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
        </>
      ) : (
        <>
          {allowTypes.length > 1 ? (
            <label className="block text-xs text-slate-500">
              按钮类型
              <select
                value={buttonType}
                onChange={(e) => onButtonType(e.target.value)}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {TYPE_OPTIONS.filter((opt) => allowTypes.includes(opt.value)).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {buttonType === 'none' ? (
            <p className="text-sm text-slate-400 py-6 text-center">这条回复不带按钮</p>
          ) : null}

          {buttonType === 'bottom' ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">拖不了，点「本行+」往键盘上加。点保存后手机立刻更新。</p>
              {rows.map(({ row, items }) => (
                <div key={row} className="flex gap-1.5 items-center">
                  {items.map((btn) => (
                    <div key={btn._index} className="flex-1 flex gap-1">
                      <input
                        value={btn.text || ''}
                        onChange={(e) => {
                          const next = menuButtons.map((item, i) =>
                            i === btn._index ? { ...item, text: e.target.value } : item
                          );
                          onMenuButtons?.(next);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-400"
                        onClick={() => onMenuButtons?.(menuButtons.filter((_, i) => i !== btn._index))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="text-[10px] text-slate-400 shrink-0" onClick={() => addMenu(row)}>
                    本行+
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-cyan-600"
                onClick={() => addMenu(rows.length ? rows[rows.length - 1].row + 1 : 0)}
              >
                新一行
              </button>
            </div>
          ) : null}

          {buttonType === 'inline' ? (
            <div className="space-y-2">
              {inlineButtons.map((btn, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={btn.text || ''}
                    onChange={(e) => patchInline(i, { text: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs"
                    placeholder="按钮文字"
                  />
                  <input
                    value={btn.data || ''}
                    onChange={(e) => patchInline(i, { data: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs"
                    placeholder="回调 / 链接"
                  />
                  <button type="button" className="text-xs text-red-400" onClick={() => onInlineButtons?.(inlineButtons.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="text-xs text-cyan-600" onClick={() => addInline()}>
                添加按钮
              </button>
              {library.length ? (
                <div>
                  <p className="text-xs text-slate-500 mt-2 mb-1">从组件库添加</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {library.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => addInline({ text: item.name, type: 'callback', data: item.key, row: 0, col: 0 })}
                        className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-50"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {buttonType === 'system' ? (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">点一项，这条回复就走系统功能（代付 / 能量 / 闪兑…）</p>
              {(actions.length
                ? actions
                : Object.entries(ACTION_SLASH).map(([value, meta]) => ({ value, label: meta.description }))
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    onSystemAction
                      ? onSystemAction(item.value)
                      : addInline({ text: item.label, type: 'callback', data: item.value, row: 0, col: 0 })
                  }
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg border ${
                    systemAction === item.value ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 hover:border-cyan-400'
                  }`}
                >
                  {item.icon ? `${item.icon} ` : ''}
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg">
          取消
        </button>
        <button
          type="button"
          onClick={() => (step === 1 ? onStep(2) : onSave())}
          disabled={saving}
          className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg font-bold disabled:opacity-50"
        >
          {saving ? '保存中' : step === 1 ? '下一步：关联按钮' : '保存'}
        </button>
      </div>
    </div>
  );
}
