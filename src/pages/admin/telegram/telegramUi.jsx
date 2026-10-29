import { wrapHtml, sanitizeTgHtml } from './telegramStudio';

export function PageHint({ title, children }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{children}</p>
    </div>
  );
}

export function StatChip({ label, value, extra }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-bold text-slate-900 leading-tight">
        {value}
        {extra ? <span className="ml-1.5 text-xs font-medium text-slate-400">{extra}</span> : null}
      </p>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className={`relative inline-block w-9 h-5 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-300'}`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
      {label ? <span className="text-xs text-slate-600">{label}</span> : null}
    </label>
  );
}

export function PhoneFrame({ caption, children }) {
  return (
    <div className="w-[280px] shrink-0">
      {caption ? <p className="text-xs text-slate-500 mb-2">{caption}</p> : null}
      <div className="bg-[#0e1621] rounded-[28px] p-2.5 shadow-xl border border-slate-800">
        <div className="flex justify-center py-1">
          <div className="w-16 h-1.5 rounded-full bg-slate-700" />
        </div>
        <div className="bg-[#17212b] rounded-2xl min-h-[420px] p-3 text-[13px] text-[#e4edf5] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function SignalBattery() {
  return (
    <span className="flex items-center gap-1">
      <span className="flex items-end gap-px h-2.5">
        <span className="w-[2px] h-1 bg-white rounded-sm" />
        <span className="w-[2px] h-1.5 bg-white rounded-sm" />
        <span className="w-[2px] h-2 bg-white rounded-sm" />
        <span className="w-[2px] h-2.5 bg-white rounded-sm" />
      </span>
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
        <path d="M6.5 8.5c1.8-1.7 4.7-1.7 6.5 0M6.5 5.6C8.4 3.7 11.6 3.7 13.5 5.6M6.5 2.7C9.2.4 13.8.4 16.5 2.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" transform="translate(-5,0)" />
        <circle cx="6.5" cy="9" r="0.7" fill="white" />
      </svg>
      <span className="relative w-[22px] h-[10px] rounded-[3px] border border-white/90">
        <span className="absolute inset-[1.5px] right-[3px] bg-white rounded-[1px]" />
        <span className="absolute -right-[2px] top-[2px] h-[5px] w-[1.5px] rounded-r-sm bg-white/90" />
      </span>
    </span>
  );
}

// 右侧真机：状态栏 + Telegram 顶栏 + 聊天区 + 输入栏
export function TelegramDevice({
  caption,
  extra,
  title = 'Bot',
  subtitle = 'bot',
  avatar,
  children,
  footer,
  bodyRef,
  className = ''
}) {
  const initial = String(title || 'B').slice(0, 1);
  return (
    <div className={`w-[308px] shrink-0 ${className}`}>
      {caption || extra ? (
        <div className="flex items-center justify-between gap-2 mb-2">
          {caption ? <p className="text-xs text-slate-500">{caption}</p> : <span />}
          {extra}
        </div>
      ) : null}
      <div className="relative bg-[#1c1c1e] rounded-[40px] p-[11px] shadow-[0_18px_50px_rgba(15,23,42,0.28)] ring-1 ring-black/20">
        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[86px] h-[22px] bg-black rounded-full z-20 shadow-inner" />
        <div className="rounded-[30px] overflow-hidden bg-[#517da2] flex flex-col h-[620px]">
          <div className="h-9 px-5 flex items-end justify-between text-white text-[11px] font-semibold pb-1">
            <span>9:41</span>
            <SignalBattery />
          </div>
          <div className="px-2 pb-2 flex items-center gap-2">
            <span className="text-white text-lg leading-none px-1">‹</span>
            {avatar ? (
              <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover bg-white/20" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-white/25 text-white text-sm font-bold flex items-center justify-center">
                {initial}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white text-[13px] font-semibold leading-tight truncate">{title}</p>
              <p className="text-white/70 text-[10px] leading-tight">{subtitle}</p>
            </div>
            <span className="text-white/90 text-lg px-1">⋮</span>
          </div>
          <div
            ref={bodyRef}
            className="flex-1 min-h-0 overflow-y-auto px-2 py-2"
            style={{
              backgroundColor: '#b9cfe0',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.42) 1px, transparent 1px)',
              backgroundSize: '14px 14px'
            }}
          >
            {children}
          </div>
          {footer}
          <div className="bg-[#f0f0f0] h-5 flex items-center justify-center">
            <div className="w-28 h-1 rounded-full bg-black/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TgChatBubble({ html, text, side = 'in', time = '9:41', active, onClick }) {
  const incoming = side === 'in';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full mb-1.5 ${incoming ? 'justify-start' : 'justify-end'} ${onClick ? '' : 'cursor-default'}`}
    >
      <div
        className={`max-w-[86%] px-2.5 py-1.5 text-left text-[13px] leading-[1.35] shadow-sm ${
          incoming
            ? 'bg-white text-[#111] rounded-[16px] rounded-bl-sm'
            : 'bg-[#e1ffc7] text-[#111] rounded-[16px] rounded-br-sm'
        } ${active ? 'ring-2 ring-cyan-400' : ''}`}
      >
        {html ? (
          <div className="break-words" dangerouslySetInnerHTML={{ __html: sanitizeTgHtml(html) }} />
        ) : (
          <div className="whitespace-pre-wrap break-words">{text || '（还没有文字）'}</div>
        )}
        <p className={`text-[10px] mt-0.5 ${incoming ? 'text-slate-400' : 'text-[#5a9c4a]'} text-right leading-none`}>
          {time}
          {incoming ? '' : ' ✓✓'}
        </p>
      </div>
    </button>
  );
}

export function TgTyping() {
  return (
    <div className="flex justify-start mb-1.5">
      <div className="bg-white rounded-[16px] rounded-bl-sm px-3 py-2.5 shadow-sm flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
      </div>
    </div>
  );
}

export function TgReplyKeyboard({ rows = [], activeIndex = -1, onPress }) {
  if (!rows.length) return null;
  return (
    <div className="bg-[#d6d6d6] p-px">
      {rows.map(({ row, items }) => (
        <div key={row} className="flex">
          {items.map((btn) => (
            <button
              key={btn._index}
              type="button"
              onClick={() => onPress?.(btn)}
              className={`flex-1 m-px py-2.5 text-[12px] bg-white text-[#111] ${
                activeIndex === btn._index ? 'bg-cyan-50 text-cyan-800' : ''
              } ${btn.enabled === false ? 'opacity-40' : ''}`}
            >
              {btn.text || '空'}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export function TgComposer() {
  return (
    <div className="bg-[#f0f0f0] px-2 py-1.5 flex items-center gap-2">
      <span className="text-slate-400 text-lg leading-none">＋</span>
      <div className="flex-1 h-8 rounded-full bg-white border border-slate-200 px-3 text-[12px] text-slate-400 flex items-center">
        输入消息
      </div>
      <span className="text-slate-400 text-base leading-none">🎤</span>
    </div>
  );
}

export function StepTabs({ step, onChange, labels = ['1 内容与回复', '2 关联按钮'] }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(i + 1)}
          className={`flex-1 text-xs py-1.5 rounded-md ${step === i + 1 ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-500'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function TgBubble({ html, text }) {
  return (
    <div className="bg-[#182533] rounded-xl rounded-tl-sm px-3 py-2 leading-relaxed whitespace-pre-wrap break-words">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeTgHtml(html) }} />
      ) : (
        text || '（还没有文字）'
      )}
    </div>
  );
}

export function HtmlBar({ textareaId, value, onChange }) {
  const wrap = (open, close) => {
    const el = document.getElementById(textareaId);
    const start = el?.selectionStart;
    const end = el?.selectionEnd;
    onChange(wrapHtml(value || '', start, end, open, close));
  };
  const chip = (label, open, close) => (
    <button
      type="button"
      onClick={() => wrap(open, close)}
      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-wrap gap-1">
      {chip('粗体', '<b>', '</b>')}
      {chip('斜体', '<i>', '</i>')}
      {chip('代码', '<code>', '</code>')}
      {chip('换行', '', '\n')}
    </div>
  );
}
