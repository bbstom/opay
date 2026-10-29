import { AlipayIcon, WechatIcon } from '../../../components/Icons';

export default function SettingsPaymentTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">支付平台配置</h2>
                
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">API版本</label>
                  <select
                    value={settings.paymentApiVersion}
                    onChange={(e) => setSettings({ ...settings, paymentApiVersion: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  >
                    <option value="v1">V1 (旧版)</option>
                    <option value="v2">V2 (新版)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">API地址</label>
                  <input
                    type="url"
                    value={settings.paymentApiUrl}
                    onChange={(e) => setSettings({ ...settings, paymentApiUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">商户ID</label>
                  <input
                    type="text"
                    value={settings.paymentMerchantId}
                    onChange={(e) => setSettings({ ...settings, paymentMerchantId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">
                    {settings.paymentApiVersion === 'v2' ? '商户私钥' : 'MD5密钥'}
                  </label>
                  <textarea
                    value={settings.paymentApiKey}
                    onChange={(e) => setSettings({ ...settings, paymentApiKey: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                    rows="4"
                  />
                </div>

                {settings.paymentApiVersion === 'v2' && (
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">平台公钥</label>
                    <textarea
                      value={settings.paymentPublicKey}
                      onChange={(e) => setSettings({ ...settings, paymentPublicKey: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                      rows="4"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">回调地址</label>
                  <input
                    type="url"
                    value={settings.paymentNotifyUrl}
                    onChange={(e) => setSettings({ ...settings, paymentNotifyUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                  />
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-black text-slate-800 mb-4">支付方式开关</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <AlipayIcon className="w-8 h-8" />
                        <span className="font-bold text-slate-700">支付宝</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.paymentAlipayEnabled}
                          onChange={(e) => setSettings({ ...settings, paymentAlipayEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0095ff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0095ff]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <WechatIcon className="w-8 h-8" />
                        <span className="font-bold text-slate-700">微信支付</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.paymentWechatEnabled}
                          onChange={(e) => setSettings({ ...settings, paymentWechatEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0095ff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0095ff]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            
  );
}
