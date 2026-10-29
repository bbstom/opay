export default function SettingsHeroTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates }) {
  return (

              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 mb-4">主页展示图片</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 设置主页右侧展示的图片，建议使用高质量的横向图片，推荐尺寸：1200x800 或更大
                  </p>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">图片URL</label>
                  <input
                    type="url"
                    value={settings.homeHeroImage || ''}
                    onChange={(e) => setSettings({ ...settings, homeHeroImage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-slate-500 mt-1">输入图片的完整URL地址</p>
                </div>

                {settings.homeHeroImage && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">图片预览</h3>
                    <div className="relative bg-white/40 backdrop-blur-xl border border-white p-3 rounded-3xl shadow-lg max-w-md">
                      <img 
                        src={settings.homeHeroImage} 
                        alt="主页展示图片预览" 
                        className="rounded-2xl shadow-sm grayscale-[0.5] opacity-90 w-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden items-center justify-center h-48 bg-slate-100 rounded-2xl">
                        <p className="text-sm text-slate-500">图片加载失败，请检查URL是否正确</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      💡 提示：图片会自动应用灰度和透明度效果，与主页风格保持一致
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">推荐图片来源</h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>• Unsplash: <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">unsplash.com</a> (免费高质量图片)</p>
                    <p>• Pexels: <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">pexels.com</a> (免费商用图片)</p>
                    <p>• 自己的服务器或CDN上传的图片</p>
                  </div>
                </div>
              </div>
            
  );
}
