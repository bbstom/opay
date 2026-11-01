import { ACTION_SLASH, CORE_SCENES, FLOW_ACTIONS, NAV_ACTIONS, isSubmenuKey } from './telegramStudio';

export default function TelegramBindField({
  kind,
  value,
  onChange,
  actions = [],
  pages = [],
  allowSubmenu = false
}) {
  const systemOptions = (() => {
    const base = actions.length
      ? actions
      : Object.entries(ACTION_SLASH).map(([item, meta]) => ({ value: item, label: meta.description }));
    const extras = [
      ...Object.entries(FLOW_ACTIONS).map(([item, meta]) => ({ value: item, label: meta.description })),
      ...Object.entries(NAV_ACTIONS).map(([item, meta]) => ({ value: item, label: meta.description }))
    ];
    const seen = new Set(base.map((item) => item.value));
    return base.concat(extras.filter((item) => !seen.has(item.value)));
  })();

  const setKind = (nextKind) => {
    if (nextKind === 'system') {
      onChange(nextKind, ACTION_SLASH[value] || FLOW_ACTIONS[value] || NAV_ACTIONS[value] ? value : systemOptions[0]?.value || 'payment_usdt');
      return;
    }
    if (nextKind === 'submenu') {
      onChange(nextKind, isSubmenuKey(value) ? value : '');
      return;
    }
    if (nextKind === 'page') {
      onChange(nextKind, pages[0]?.key || CORE_SCENES[0]?.key || '');
      return;
    }
    onChange(nextKind, /^https?:\/\//i.test(value) ? value : '');
  };

  return (
    <div className="flex gap-1 min-w-0">
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        className="w-[100px] shrink-0 bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 text-xs"
      >
        <option value="system">{allowSubmenu ? '直达功能' : '系统功能'}</option>
        {allowSubmenu ? <option value="submenu">子菜单</option> : null}
        <option value="page">自定义页</option>
        <option value="url">打开链接</option>
      </select>

      {kind === 'system' ? (
        <select
          value={value}
          onChange={(e) => onChange(kind, e.target.value)}
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 text-xs"
        >
          {systemOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
          {value && !systemOptions.some((item) => item.value === value) ? (
            <option value={value}>{value}</option>
          ) : null}
        </select>
      ) : null}

      {kind === 'submenu' ? (
        <span className="flex-1 text-[11px] text-slate-500 px-1 py-1.5">点进去出现第二层</span>
      ) : null}

      {kind === 'page' ? (
        <select
          value={value}
          onChange={(e) => onChange(kind, e.target.value)}
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 text-xs"
        >
          {value && !pages.some((item) => item.key === value) && !CORE_SCENES.some((item) => item.key === value) ? (
            <option value={value}>{value}</option>
          ) : null}
          <optgroup label="自定义页面">
            {pages.length ? (
              pages.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name || item.key}
                </option>
              ))
            ) : (
              <option value="" disabled>
                还没有自定义页面
              </option>
            )}
          </optgroup>
          <optgroup label="系统场景">
            {CORE_SCENES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.title}
              </option>
            ))}
          </optgroup>
        </select>
      ) : null}

      {kind === 'url' ? (
        <input
          value={value}
          onChange={(e) => onChange(kind, e.target.value)}
          placeholder="https://"
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs"
        />
      ) : null}
    </div>
  );
}
