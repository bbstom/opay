import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import axios from '../../../api/client';

const parseBots = (raw) => {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const emptyBot = () => ({
  id: `bot-${Date.now()}`,
  username: '',
  token: '',
  enabled: true,
  hasToken: false
});

export default function TelegramBotsTab() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const loadBots = async () => {
    const { data } = await axios.get('/api/settings');
    const list = parseBots(data.telegramBots).map((bot) => ({
      id: bot.id || `bot-${Date.now()}`,
      username: String(bot.username || '').replace(/^@+/, ''),
      token: '',
      enabled: bot.enabled !== false,
      hasToken: !!bot.hasToken
    }));
    setBots(list.length ? list : [emptyBot()]);
    setReady(true);
  };

  useEffect(() => {
    loadBots().catch((err) => console.error('获取 Telegram Bot 配置失败:', err));
  }, []);

  const updateBot = (index, patch) => {
    setBots((prev) => prev.map((bot, i) => (i === index ? { ...bot, ...patch } : bot)));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put('/api/settings', {
        telegramBots: JSON.stringify(
          bots.map((bot) => ({
            id: bot.id,
            username: String(bot.username || '').replace(/^@+/, '').trim(),
            token: String(bot.token || '').trim(),
            enabled: bot.enabled !== false
          }))
        )
      });
      await loadBots();
      alert('已保存。Bot 会按新 Token 自动重启。');
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <div className="py-8 text-center text-sm text-slate-500">加载 Bot...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Bot 凭证</h3>
          <p className="text-xs text-slate-500 mt-1">
            Token 存在数据库，不写 .env。已保存的不会回显，留空表示不改。
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-cyan-600 disabled:opacity-50"
        >
          <Save size={14} /> {loading ? '保存中' : '保存 Bot'}
        </button>
      </div>

      {bots.map((bot, index) => (
        <div key={bot.id} className="border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">
              {index === 0 ? '主 Bot（登录 / 邀请）' : `Bot ${index + 1}`}
              <span className={`ml-2 text-xs font-medium ${bot.enabled !== false && bot.hasToken ? 'text-emerald-600' : 'text-slate-400'}`}>
                {bot.enabled === false ? '已关闭' : bot.hasToken ? '已保存 Token' : '还没填 Token'}
              </span>
            </p>
            <button type="button" onClick={() => setBots((prev) => prev.filter((_, i) => i !== index))} className="text-slate-400 hover:text-red-600 p-1">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <label className="text-xs text-slate-500">
              启用
              <select
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={bot.enabled !== false ? '1' : '0'}
                onChange={(e) => updateBot(index, { enabled: e.target.value === '1' })}
              >
                <option value="1">开</option>
                <option value="0">关</option>
              </select>
            </label>
            <label className="text-xs text-slate-500 md:col-span-1">
              用户名（不含 @）
              <input
                value={bot.username}
                onChange={(e) => updateBot(index, { username: e.target.value })}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Trxec_bot"
              />
            </label>
            <label className="text-xs text-slate-500">
              Token
              <input
                type="password"
                value={bot.token}
                onChange={(e) => updateBot(index, { token: e.target.value })}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder={bot.hasToken ? '已保存，留空不改' : '从 BotFather 复制'}
                autoComplete="new-password"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setBots((prev) => [...prev, emptyBot()])}
        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
      >
        <Plus size={14} /> 再加一个 Bot
      </button>
    </div>
  );
}
