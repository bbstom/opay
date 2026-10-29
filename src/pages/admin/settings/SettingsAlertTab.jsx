export default function SettingsAlertTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">⚠️ 工作台警告弹窗配置</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>功能说明：</strong>用户每次访问代付控制台（USDT代付/TRX代付页面）时，会弹出警告提示。支持HTML格式，可以设置文字颜色、大小、加粗等样式。
                  </p>
                </div>

                {/* 启用开关 */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">启用警告弹窗</h3>
                      <p className="text-sm text-slate-500">开启后，用户访问代付页面时会自动弹出警告提示</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.workspaceAlertEnabled || false}
                        onChange={(e) => setSettings({ ...settings, workspaceAlertEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                </div>

                {/* 弹窗标题 */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                  <label className="text-sm font-bold text-slate-600 block mb-2">弹窗标题</label>
                  <input
                    type="text"
                    value={settings.workspaceAlertTitle || '重要提示'}
                    onChange={(e) => setSettings({ ...settings, workspaceAlertTitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="重要提示"
                  />
                </div>

                {/* 弹窗内容 */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                  <label className="text-sm font-bold text-slate-600 block mb-2">弹窗内容（支持HTML）</label>
                  <textarea
                    value={settings.workspaceAlertContent || ''}
                    onChange={(e) => setSettings({ ...settings, workspaceAlertContent: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none font-mono text-sm"
                    rows="10"
                    placeholder="请输入警告内容，支持HTML标签..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    支持HTML标签，可以使用以下标签设置样式：
                  </p>
                </div>

                {/* HTML 标签示例 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">📝 HTML 标签使用示例</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-1">1. 文字颜色</div>
                      <code className="block bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 overflow-x-auto">
                        {'<span style="color: #DC2626;">红色文字</span>'}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-1">2. 文字大小</div>
                      <code className="block bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 overflow-x-auto">
                        {'<span style="font-size: 18px;">大号文字</span>'}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-1">3. 文字加粗</div>
                      <code className="block bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 overflow-x-auto">
                        {'<strong>加粗文字</strong> 或 <b>加粗文字</b>'}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-1">4. 组合使用</div>
                      <code className="block bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 overflow-x-auto">
                        {'<span style="color: #DC2626; font-size: 18px;"><strong>重要提示</strong></span>'}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-1">5. 换行</div>
                      <code className="block bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 overflow-x-auto">
                        {'第一行<br/>第二行'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* 完整示例 */}
                <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-green-700 mb-3">✨ 完整示例</h3>
                  <code className="block bg-slate-50 border border-slate-200 rounded px-4 py-3 text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap">
{`<div style="text-align: center;">
  <span style="color: #DC2626; font-size: 20px;"><strong>⚠️ 重要提示</strong></span>
  <br/><br/>
  <span style="font-size: 16px;">请仔细核对收款地址，确保转账信息准确无误。</span>
  <br/><br/>
  <span style="color: #059669; font-size: 14px;">转账前请务必确认地址正确，避免资金损失。</span>
</div>`}
                  </code>
                </div>

                {/* 实时预览 */}
                {settings.workspaceAlertEnabled && settings.workspaceAlertContent && (
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-blue-700 mb-4">👁️ 实时预览</h3>
                    <div className="bg-white rounded-xl border-2 border-slate-300 shadow-xl p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">
                        {settings.workspaceAlertTitle || '重要提示'}
                      </h3>
                      <div 
                        className="text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: settings.workspaceAlertContent }}
                      />
                    </div>
                  </div>
                )}

                {/* 注意事项 */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-red-800 mb-2">⚠️ 安全提示</h3>
                  <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                    <li>请勿在内容中包含恶意脚本（script标签会被过滤）</li>
                    <li>建议使用简洁明了的提示文字</li>
                    <li>颜色建议使用十六进制格式（如：#DC2626）</li>
                    <li>修改后立即生效，用户下次访问时会看到新内容</li>
                  </ul>
                </div>
              </div>
            
  );
}
