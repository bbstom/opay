import { useEffect, useState } from 'react';
import { apiFetch } from '../../../api/client';
import TelegramBotsTab from './TelegramBotsTab';
import TelegramGroupsPanel from './TelegramGroupsPanel';
import { PageHint, StatChip } from './telegramUi';

export default function TelegramHubTab() {
  const [stats, setStats] = useState({});
  const [groups, setGroups] = useState([]);

  const load = async () => {
    try {
      const [statsRes, groupsRes] = await Promise.all([
        apiFetch('/api/telegram/stats'),
        apiFetch('/api/telegram/groups')
      ]);
      setStats(await statsRes.json());
      const list = await groupsRes.json();
      setGroups(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('加载连接信息失败:', err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const feedCount = groups.filter((g) => g.energyFeed).length;

  return (
    <div className="space-y-4">
      <PageHint title="我的机器人">
        先让 Bot 活着，再决定哪些群能收手动群发、哪些群收能量成交公告。网站登录和邀请链接用列表里第一个已启用的 Bot。
      </PageHint>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatChip label="Bot 用户" value={stats.totalUsers || 0} extra={`今日 +${stats.todayUsers || 0}`} />
        <StatChip label="7 日活跃" value={stats.activeUsers || 0} />
        <StatChip label="已加入的群" value={groups.length} />
        <StatChip label="能量动态群" value={feedCount} extra={feedCount ? '租成功会推群' : '还没打开'} />
      </div>

      <TelegramBotsTab />
      <TelegramGroupsPanel groups={groups} onChanged={load} />
    </div>
  );
}
