import { useEffect, useRef, useState } from 'react';
import { useSettingsOptional } from '../../../context/SettingsContext';
import {
  ACTION_SCENE,
  WELCOME_VERSIONS,
  buttonsByRow,
  contentText,
  fillPreviewVars
} from './telegramStudio';
import {
  TelegramDevice,
  TgChatBubble,
  TgComposer,
  TgReplyKeyboard,
  TgTyping
} from './telegramUi';

let lineSeq = 0;
const uid = () => `tg-line-${++lineSeq}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TMA_INTRO =
  `💰 <b>USDT 代付</b><br/><br/>点下方按钮打开代付页面，填写地址和数量即可。<br/>也可以继续在对话里下单。`;

const TMA_BUTTONS = [
  { text: '打开 USDT 代付', type: 'web_app', data: 'tma_pay', _index: 9001 },
  { text: '对话里下单', type: 'callback', data: 'payment_usdt_chat', _index: 9002 }
];

const nextFromInline = (btn, contentsByKey, welcomeKey) => {
  const data = String(btn.data || btn.action || '');
  if (btn.type === 'url') return { key: null, url: true };
  if (ACTION_SCENE[data]) return { key: ACTION_SCENE[data].key };
  if (contentsByKey[data]) return { key: data };
  if (data === 'back_to_main') return { key: contentsByKey.main_menu ? 'main_menu' : welcomeKey };
  if (data === 'help_faq' || data === 'help_contact' || data === 'help_tutorial' || data === 'help_center') {
    return { key: data };
  }
  return { key: null };
};

export default function TelegramStudioPhone({
  welcomeId,
  onWelcomeId,
  selected,
  onSelect,
  viewKey,
  liveText,
  liveButtons = [],
  liveMenu = [],
  contentsByKey = {}
}) {
  const settings = useSettingsOptional();
  const botName = settings?.siteName || '可可代付';
  const botLogo = settings?.siteLogo || '';
  const welcomeKey = WELCOME_VERSIONS.find((item) => item.id === welcomeId)?.key || 'welcome_new_user';
  const scroller = useRef(null);
  const firstWelcome = useRef(true);
  const [lines, setLines] = useState([]);
  const [typing, setTyping] = useState(false);
  const [miniApp, setMiniApp] = useState(false);
  const busy = useRef(false);
  const buttonsSig = JSON.stringify(liveButtons);

  const previewText = (text) => fillPreviewVars(text, { siteName: botName });
  const sceneText = (key) => previewText(key === viewKey ? liveText : contentText(contentsByKey[key]));
  const sceneButtons = (key) => (key === viewKey ? liveButtons : contentsByKey[key]?.buttons || []);

  const botLine = (key) => ({
    id: uid(),
    from: 'bot',
    key,
    text: sceneText(key),
    buttons: sceneButtons(key)
  });

  const resetChat = () => {
    setTyping(false);
    setMiniApp(false);
    busy.current = false;
    setLines([
      { id: uid(), from: 'user', text: '/start' },
      botLine(welcomeKey)
    ]);
  };

  useEffect(() => {
    resetChat();
    if (firstWelcome.current) {
      firstWelcome.current = false;
      return;
    }
    onSelect?.({ kind: 'start' });
    // 只在切换新/老用户时重开一场
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeId]);

  useEffect(() => {
    setLines((prev) => {
      if (!prev.length) return prev;
      return prev.map((line) =>
        line.from === 'bot' && line.key === viewKey
          ? { ...line, text: previewText(liveText), buttons: liveButtons }
          : line
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, liveText, buttonsSig]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, typing]);

  const pushBot = async (key, selectPayload) => {
    if (busy.current) return;
    busy.current = true;
    setTyping(true);
    await wait(360);
    setTyping(false);
    setLines((prev) => [...prev, botLine(key)]);
    onSelect?.(selectPayload);
    busy.current = false;
  };

  const onMenu = async (btn) => {
    if (busy.current || btn.enabled === false) return;
    setLines((prev) => [...prev, { id: uid(), from: 'user', text: btn.text || '…' }]);
    if (btn.action === 'payment_usdt') {
      busy.current = true;
      setTyping(true);
      await wait(360);
      setTyping(false);
      setLines((prev) => [
        ...prev,
        { id: uid(), from: 'bot', key: 'payment_usdt_tma', text: TMA_INTRO, buttons: TMA_BUTTONS }
      ]);
      onSelect?.({ kind: 'menu', index: btn._index });
      busy.current = false;
      return;
    }
    const key = ACTION_SCENE[btn.action]?.key || btn.action;
    await pushBot(key, { kind: 'menu', index: btn._index });
  };

  const onInline = async (line, btn) => {
    if (busy.current) return;
    if (btn.data === 'tma_pay' || btn.type === 'web_app') {
      setMiniApp(true);
      return;
    }
    if (btn.data === 'payment_usdt_chat') {
      await pushBot('payment_usdt_input', { kind: 'scene', key: 'payment_usdt_input' });
      return;
    }
    if (btn.data === 'payment_usdt' || btn.action === 'payment_usdt') {
      setLines((prev) => [
        ...prev,
        { id: uid(), from: 'bot', key: 'payment_usdt_tma', text: TMA_INTRO, buttons: TMA_BUTTONS }
      ]);
      return;
    }
    const next = nextFromInline(btn, contentsByKey, welcomeKey);
    onSelect?.({ kind: 'inline', index: btn._index, parentKey: line.key });
    if (next.url || !next.key || next.key === line.key) return;
    await pushBot(next.key, { kind: 'scene', key: next.key });
  };

  const onBotBubble = (line) => {
    if (line.key === welcomeKey) {
      onSelect?.({ kind: welcomeId ? 'welcome' : 'start' });
      return;
    }
    const menuIndex = liveMenu.findIndex((btn) => ACTION_SCENE[btn.action]?.key === line.key);
    if (menuIndex >= 0) {
      onSelect?.({ kind: 'menu', index: menuIndex });
      return;
    }
    onSelect?.({ kind: 'scene', key: line.key });
  };

  const menuIndex = selected?.kind === 'menu' ? selected.index : -1;
  const inlineIndex = selected?.kind === 'inline' ? selected.index : -1;
  const rows = buttonsByRow(liveMenu);

  return (
    <TelegramDevice
      className="xl:sticky xl:top-4 order-first xl:order-last"
      caption="点气泡或按钮，像在 Telegram 里点"
      title={botName}
      subtitle="bot"
      avatar={botLogo}
      bodyRef={scroller}
      extra={
        <div className="flex gap-1">
          {WELCOME_VERSIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onWelcomeId(item.id)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                welcomeId === item.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item.title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              resetChat();
              onSelect?.({ kind: 'start' });
            }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
          >
            重播
          </button>
        </div>
      }
      cover={
        miniApp ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-[#2aabee] text-white text-[11px]">
              <span>USDT 代付 Mini App</span>
              <button type="button" className="font-bold" onClick={() => setMiniApp(false)}>
                关闭
              </button>
            </div>
            <iframe title="USDT 代付" src="/tma/pay" className="flex-1 w-full border-0 bg-white" />
          </div>
        ) : null
      }
      footer={
        <>
          <TgReplyKeyboard rows={rows} activeIndex={menuIndex} onPress={onMenu} />
          <TgComposer />
        </>
      }
    >
      <p className="text-center text-[10px] text-slate-600/80 my-2">
          <span className="bg-black/10 rounded-full px-2 py-0.5">今天</span>
        </p>
        {lines.map((line) => {
          if (line.from === 'user') {
            return <TgChatBubble key={line.id} side="out" text={line.text} />;
          }
          const active = line.key === viewKey;
          return (
            <div key={line.id}>
              <TgChatBubble
                side="in"
                html={line.text}
                active={active}
                onClick={() => onBotBubble(line)}
              />
              {line.buttons?.length ? (
                <div className="mb-2 space-y-1 px-0.5">
                  {buttonsByRow(line.buttons).map(({ row, items }) => (
                    <div key={row} className="flex gap-1">
                      {items.map((btn) => (
                        <button
                          key={btn._index}
                          type="button"
                          onClick={() => onInline(line, btn)}
                          className={`flex-1 text-[11px] py-1.5 rounded-md bg-white/90 text-[#2a6ea6] shadow-sm ${
                            line.key === viewKey && inlineIndex === btn._index ? 'ring-2 ring-cyan-400' : ''
                          }`}
                        >
                          {btn.text || '空'}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {typing ? <TgTyping /> : null}
    </TelegramDevice>
  );
}
