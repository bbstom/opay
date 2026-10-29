import { apiFetch } from '../../../api/client';
import { ENERGY_FEED_SAMPLE } from './telegramStudio';
import { Toggle } from './telegramUi';

const typeLabel = {
  group: '群组',
  supergroup: '超级群',
  channel: '频道'
};

export default function TelegramGroupsPanel({ groups = [], onChanged }) {
  const toggle = async (group, field, value) => {
    try {
      const res = await apiFetch(`/api/telegram/groups/${encodeURIComponent(group.chatId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '更新失败');
        return;
      }
      onChanged?.();
    } catch (err) {
      alert('更新失败: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-800">群组用途</h3>
        <p className="text-xs text-slate-500 mt-1">
          把 Bot 拉进群并在群里说一句话，这里就会出现。能量动态打开后，租能量成功会按下面格式推群，地址自动打码。
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">还没有群</p>
          <p className="text-xs text-slate-400 mt-1">BotFather 拿到 Token → 拉进群 → 群里发条消息 → 回到这里刷新</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {groups.map((group) => (
            <div key={group.chatId} className="border border-slate-200 rounded-xl p-3 space-y-3">
              <div>
                <p className="text-sm font-bold text-slate-800">{group.title || group.chatId}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {typeLabel[group.type] || group.type}
                  {group.username ? ` · @${group.username}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Toggle
                  checked={group.allowBroadcast !== false}
                  onChange={(v) => toggle(group, 'allowBroadcast', v)}
                  label="可手动群发"
                />
                <Toggle
                  checked={!!group.energyFeed}
                  onChange={(v) => toggle(group, 'energyFeed', v)}
                  label="能量成交推群"
                />
              </div>
              {group.energyFeed ? (
                <pre className="text-[11px] leading-5 bg-[#17212b] text-[#e4edf5] rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {ENERGY_FEED_SAMPLE}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
