export default function RewardRulesTab({ settings, setSettings }) {
  const num = (key, fallback) => Number(settings[key] ?? fallback);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">邀请 / 签到规则</h2>
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <p className="text-sm text-cyan-800">
          签到和邀请发放 TRX 余额，可在能量租赁页扣款。下级产生代付或能量消费后，按折合 USDT 的比例给邀请人 USDT 奖励，可提现。
        </p>
      </div>

      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <p className="font-bold text-slate-800">启用奖励系统</p>
          <p className="text-xs text-slate-500">关闭后签到、邀请发放、消费返佣、余额租赁均不可用</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.rewardEnabled !== false}
            onChange={(e) => setSettings({ ...settings, rewardEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500" />
        </label>
      </div>

      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <p className="font-bold text-slate-800">启用每日签到</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.checkinEnabled !== false}
            onChange={(e) => setSettings({ ...settings, checkinEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">每日签到奖励（TRX）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={num('checkinTrx', 1)}
            onChange={(e) => setSettings({ ...settings, checkinTrx: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">邀请注册奖励（TRX）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={num('inviteSignupTrx', 5)}
            onChange={(e) => setSettings({ ...settings, inviteSignupTrx: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">下级消费返佣（% of USDT）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={num('consumeRewardUsdtPercent', 5)}
            onChange={(e) => setSettings({ ...settings, consumeRewardUsdtPercent: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-xs text-slate-500 mt-1">按下级代付金额或能量租赁折合 USDT 计算</p>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">最低提现（USDT）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={num('withdrawMinUsdt', 10)}
            onChange={(e) => setSettings({ ...settings, withdrawMinUsdt: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">提现手续费（USDT）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={num('withdrawFeeUsdt', 0)}
            onChange={(e) => setSettings({ ...settings, withdrawFeeUsdt: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
