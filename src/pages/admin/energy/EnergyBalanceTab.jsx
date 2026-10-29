export default function EnergyBalanceTab({ settings, setSettings }) {
  const sameAddress = settings.trxDepositAddress
    && settings.energyRentalAddress
    && settings.trxDepositAddress.trim() === settings.energyRentalAddress.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">余额支付</h2>
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
        <p className="text-sm text-cyan-800">
          用户把 TRX 转到充值地址后，提交交易哈希入账。入账余额可在网站和 Telegram 租能量。充值地址必须和能量租赁收款地址分开。
        </p>
      </div>

      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
        <div>
          <p className="font-bold text-slate-800">启用 TRX 充值</p>
          <p className="text-xs text-slate-500">关闭后网站和 Telegram 都不能充值入账</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.trxDepositEnabled !== false}
            onChange={(e) => setSettings({ ...settings, trxDepositEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500" />
        </label>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-600 block mb-2">TRX 充值收款地址</label>
        <input
          type="text"
          value={settings.trxDepositAddress || ''}
          onChange={(e) => setSettings({ ...settings, trxDepositAddress: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
          placeholder="T 开头的 TRON 地址"
        />
        {sameAddress && (
          <p className="text-xs text-red-600 mt-1">不能和能量租赁收款地址相同，否则无法区分租赁和充值</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">最低充值（TRX）</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.trxDepositMin ?? 1}
            onChange={(e) => setSettings({ ...settings, trxDepositMin: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-slate-600 block mb-2">余额租赁最低金额（TRX）</label>
          <input
            type="number"
            min="0"
            value={settings.energyMinAmount || 10}
            onChange={(e) => setSettings({ ...settings, energyMinAmount: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">用站内 TRX 余额租能量时的下限</p>
        </div>
      </div>
    </div>
  );
}
