import { Zap } from 'lucide-react';

export default function EnergyPriceTab({ settings, setSettings }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
          <Zap className="text-white" size={20} />
        </div>
        <h2 className="text-xl font-black text-slate-800">价格配置</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          只配能量单价和有效期。最低金额、余额充值地址在左侧「余额支付配置」。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">TRX 数量</label>
          <input
            type="number"
            step="0.1"
            value={settings.energyPriceTrx || 1}
            onChange={(e) => setSettings({ ...settings, energyPriceTrx: parseFloat(e.target.value) || 1 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="1"
            min="0.1"
          />
          <p className="text-xs text-slate-500 mt-1">支持小数，如 0.5、1.5、2.8 等</p>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">能量数量</label>
          <input
            type="number"
            value={settings.energyPriceEnergy || 65000}
            onChange={(e) => setSettings({ ...settings, energyPriceEnergy: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="65000"
            min="0"
            step="1000"
          />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-bold text-slate-700 mb-2">当前价格</p>
        <p className="text-2xl font-black text-orange-600">
          {settings.energyPriceTrx || 1} TRX = {(settings.energyPriceEnergy || 65000).toLocaleString()} 能量
        </p>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-600 block mb-2">能量有效期（小时）</label>
        <input
          type="number"
          value={settings.energyValidityHours || 24}
          onChange={(e) => setSettings({ ...settings, energyValidityHours: parseInt(e.target.value) || 0 })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
          placeholder="24"
          min="0"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-slate-600 block mb-2">重要提示（自定义内容）</label>
        <textarea
          value={settings.energyNotice || ''}
          onChange={(e) => setSettings({ ...settings, energyNotice: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
          rows="4"
          placeholder="仅支持 TRX 转账&#10;最小金额：10 TRX&#10;能量有效期：24小时"
        />
        <p className="text-xs text-slate-500 mt-1">每行一条提示，显示在用户端「重要提示」</p>
      </div>
    </div>
  );
}
