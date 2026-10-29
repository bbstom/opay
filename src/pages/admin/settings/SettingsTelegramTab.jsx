export default function SettingsTelegramTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">TG客服配置</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 配置TG客服地址后，将在网站导航栏显示TG客服入口
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">TG客服地址</label>
                  <input
                    type="text"
                    value={settings.telegramCustomerService || ''}
                    onChange={(e) => setSettings({ ...settings, telegramCustomerService: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="https://t.me/your_customer_service"
                  />
                  <p className="text-xs text-slate-500 mt-1">例如：https://t.me/your_username</p>
                </div>
              </div>
            
  );
}
