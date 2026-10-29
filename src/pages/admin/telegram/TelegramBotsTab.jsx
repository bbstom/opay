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
    return <div className="py-12 text-center text-sm text-slate-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-600 transition-all disabled:opacity-50"
        >
          <Save size={20} /> {loading ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-6">
        <h2 className="text-xl font-black text-slate-800">Bot Token</h2>
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
          <p className="text-sm text-cyan-800">
            Token 保存在数据库，不再写 .env。列表第一项已启用的 Bot 用于网站登录验签和邀请链接。已保存的 Token 不会回显，留空表示不修改。
          </p>
        </div>

        {bots.map((bot, index) => (
          <div key={bot.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-800">Bot {index + 1}{index === 0 ? '（登录 / 邀请）' : ''}</p>
              <button
                type="button"
                onClick={() => setBots((prev) => prev.filter((_, i) => i !== index))}
                className="text-slate-500 hover:text-red-600 p-1"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
              <div>
                <p className="font-bold text-slate-800">启用</p>
                <p className="text-xs text-slate-500">关闭后该 Bot 不会启动</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bot.enabled !== false}
                  onChange={(e) => updateBot(index, { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500" />
              </label>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Bot 用户名</label>
              <input
                type="text"
                value={bot.username}
                onChange={(e) => updateBot(index, { username: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder="不含 @，例如 Trxec_bot"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600 block mb-2">Bot Token</label>
              <input
                type="password"
                value={bot.token}
                onChange={(e) => updateBot(index, { token: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder={bot.hasToken ? '已保存，留空不修改' : '从 BotFather 复制的 Token'}
                autoComplete="new-password"
              />
              {bot.hasToken && (
                <p className="text-xs text-slate-500 mt-1">当前已保存 Token</p>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setBots((prev) => [...prev, emptyBot()])}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
        >
          <Plus size={16} /> 添加 Bot
        </button>
      </div>
    </div>
  );
}
