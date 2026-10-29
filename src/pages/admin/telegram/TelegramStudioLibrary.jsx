import { useMemo, useState } from 'react';
import { ALL_VARS, DEFAULT_VARS } from './telegramStudio';
import { COPY_GROUPS, copyTemplates } from './telegramCopyBank';

const TABS = [
  { id: 'template', label: '模板' },
  { id: 'action', label: '系统功能' },
  { id: 'component', label: '组件' },
  { id: 'variable', label: '变量' }
];

export default function TelegramStudioLibrary({
  actions = [],
  components = [],
  variables = DEFAULT_VARS,
  onPick
}) {
  const [tab, setTab] = useState('template');
  const [group, setGroup] = useState('全部');
  const templates = useMemo(() => copyTemplates(), []);
  const shown =
    group === '全部'
      ? templates.filter((item) => !item.snippet)
      : templates.filter((item) => item.group === group);
  const shownVars = variables.length ? variables : ALL_VARS;
  const liveVars = shownVars.filter((item) => item.live !== false);
  const otherVars = shownVars.filter((item) => item.live === false);

  return (
    <div className="w-full xl:w-[280px] shrink-0 bg-white rounded-lg border border-slate-200 p-3">
      <p className="text-xs font-bold text-slate-700 mb-1">资源库</p>
      <p className="text-[11px] text-slate-400 mb-2">模板点一下套用，变量点一下插入</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`text-[11px] px-2 py-1 rounded ${tab === item.id ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'template' ? (
        <div className="flex flex-wrap gap-1 mb-2">
          {COPY_GROUPS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setGroup(name)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${group === name ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="max-h-[520px] overflow-y-auto space-y-1">
        {tab === 'template'
          ? shown.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onPick(item.snippet ? 'snippet' : 'template', item)}
                className="block w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200"
              >
                <p className="text-xs text-slate-800">
                  {item.name}
                  {item.style ? <span className="ml-1 text-[10px] text-cyan-600">套用</span> : null}
                  {item.snippet ? <span className="ml-1 text-[10px] text-slate-400">插入</span> : null}
                </p>
                {item.preview ? <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{item.preview}</p> : null}
              </button>
            ))
          : null}

        {tab === 'action'
          ? actions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onPick('action', item)}
                className="block w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 text-xs"
              >
                {item.icon ? `${item.icon} ` : ''}
                {item.label}
              </button>
            ))
          : null}

        {tab === 'component' ? (
          components.length ? (
            components.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onPick('component', item)}
                className="block w-full text-left px-2 py-1.5 rounded hover:bg-slate-50"
              >
                <p className="text-xs text-slate-800">{item.name}</p>
                <p className="text-[10px] text-slate-400">{item.key}</p>
              </button>
            ))
          ) : (
            <p className="text-xs text-slate-400 px-2 py-6 text-center">还没有组件，去「自定义组件」新建</p>
          )
        ) : null}

        {tab === 'variable' ? (
          <>
            <p className="text-[10px] text-slate-400 px-1 mb-1">这条消息发送时会填的，点一下插入</p>
            {liveVars.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onPick('variable', item)}
                className="block w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 text-xs"
              >
                {item.label || item.key}
                <span className="ml-1 text-slate-400">{`{{${item.key}}}`}</span>
              </button>
            ))}
            {otherVars.length ? (
              <>
                <p className="text-[10px] text-amber-600 px-1 mt-3 mb-1">别的场景才有值，写在这里会原样发出去</p>
                {otherVars.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onPick('variable', item)}
                    className="block w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 text-xs text-slate-500"
                  >
                    {item.label || item.key}
                    <span className="ml-1 text-slate-400">{`{{${item.key}}}`}</span>
                  </button>
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
