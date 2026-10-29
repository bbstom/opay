export default function SettingsBlogTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">博客图片配置</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>提示：</strong>配置博客详情页中图片的显示尺寸。修改后刷新博客页面即可生效。
                  </p>
                </div>

                {/* 封面图配置 */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">📷 封面图配置</h3>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-2">
                      封面图最大高度
                      <span className="text-slate-400 font-normal ml-2">（如：500px, 600px, none）</span>
                    </label>
                    <input
                      type="text"
                      value={settings.blogCoverMaxHeight || '500px'}
                      onChange={(e) => setSettings({ ...settings, blogCoverMaxHeight: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                      placeholder="500px"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      推荐：500px（适中）或 600px（较大），输入 none 表示不限制
                    </p>
                  </div>
                </div>

                {/* Markdown 图片配置 */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">🖼️ Markdown 图片配置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-slate-600 block mb-2">
                        图片最大宽度
                        <span className="text-slate-400 font-normal ml-2">（如：100%, 800px, 90vw）</span>
                      </label>
                      <input
                        type="text"
                        value={settings.blogImageMaxWidth || '100%'}
                        onChange={(e) => setSettings({ ...settings, blogImageMaxWidth: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                        placeholder="100%"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        推荐：100%（自适应容器宽度）
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-600 block mb-2">
                        图片最大高度
                        <span className="text-slate-400 font-normal ml-2">（如：500px, 800px, none）</span>
                      </label>
                      <input
                        type="text"
                        value={settings.blogImageMaxHeight || '500px'}
                        onChange={(e) => setSettings({ ...settings, blogImageMaxHeight: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                        placeholder="500px"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        推荐：500px（防止图片过高），输入 none 表示不限制
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">常用配置参考</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-32 text-xs font-bold text-slate-600">小图片：</div>
                      <div className="flex-1 text-xs text-slate-600">
                        宽度：100%，高度：300px<br/>
                        <span className="text-slate-400">适合图标、截图等小图</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-32 text-xs font-bold text-slate-600">中等图片：</div>
                      <div className="flex-1 text-xs text-slate-600">
                        宽度：100%，高度：500px<br/>
                        <span className="text-slate-400">默认配置，适合大多数情况</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-32 text-xs font-bold text-slate-600">大图片：</div>
                      <div className="flex-1 text-xs text-slate-600">
                        宽度：100%，高度：800px<br/>
                        <span className="text-slate-400">适合展示详细内容的大图</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-32 text-xs font-bold text-slate-600">不限制：</div>
                      <div className="flex-1 text-xs text-slate-600">
                        宽度：100%，高度：none<br/>
                        <span className="text-slate-400">显示图片原始尺寸（可能很大）</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-yellow-800 mb-2">⚠️ 注意事项</h3>
                  <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                    <li>修改后需要刷新博客页面才能看到效果</li>
                    <li>宽度建议使用 100% 以适应不同屏幕</li>
                    <li>高度可以使用 px 单位限制图片高度</li>
                    <li>输入 none 表示不限制该维度</li>
                  </ul>
                </div>
              </div>
            
  );
}
