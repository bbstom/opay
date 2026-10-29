import { Zap } from 'lucide-react';

export default function EnergyAddressTab({ settings, setSettings }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
          <Zap className="text-white" size={20} />
        </div>
        <h2 className="text-xl font-black text-slate-800">收款地址配置</h2>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm text-orange-800">
          用户在能量租赁页把 TRX 转到这个地址，按链上转账租赁能量。不要和「余额支付」的充值地址用同一个。
        </p>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-600 block mb-2">能量租赁收款地址</label>
        <input
          type="text"
          value={settings.energyRentalAddress || ''}
          onChange={(e) => setSettings({ ...settings, energyRentalAddress: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
          placeholder="TRX地址"
        />
        <p className="text-xs text-slate-500 mt-1">用于接收能量租赁的 TRX 转账</p>
      </div>
    </div>
  );
}
