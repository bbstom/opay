import { useState, useEffect } from 'react';
import { ArrowDownUp, Copy, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from '../api/client';

const SwapPage = () => {
  const [rate, setRate] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [swapNotice, setSwapNotice] = useState('');

  useEffect(() => {
    fetchSwapInfo();
    fetchAds();
    const interval = setInterval(fetchSwapInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSwapInfo = async () => {
    try {
      // 获取汇率
      const { data: rateData } = await axios.get('/api/swap/rate');
      setRate(rateData);
      setWalletAddress(rateData.receiveAddress || '');

      const { data: settingsData } = await axios.get('/api/settings/public');
      setSwapNotice(settingsData.swapNotice || '');
    } catch (error) {
      console.error('获取闪兑信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const { data } = await axios.get('/api/ads');
      const swapAds = data.filter(ad => ad.position === 'swap-bottom');
      setAds(swapAds);
    } catch (error) {
      console.error('获取广告失败:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 pt-16 pb-6">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 pt-16 pb-6">
      <div className="max-w-4xl mx-auto px-4 w-full">
        {/* 标题 - 更紧凑 */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl mb-2 shadow-lg shadow-cyan-200">
            <ArrowDownUp className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">USDT 闪兑 TRX</h1>
          <p className="text-sm text-slate-600">快速、安全、自动化</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-lg">
          {/* 汇率显示 - 更紧凑 */}
          {rate && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-3 mb-4 border border-cyan-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">当前汇率</p>
                  <p className="text-xl font-black text-slate-900">1 USDT = {rate.rate} TRX</p>
                </div>
                <button 
                  onClick={fetchSwapInfo} 
                  className="p-2 hover:bg-white rounded-lg transition-all"
                  title="刷新汇率"
                >
                  <RefreshCw size={18} className="text-cyan-600" />
                </button>
              </div>
            </div>
          )}

          {/* 闪兑钱包地址和二维码 */}
          {walletAddress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 左侧：二维码 */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm font-bold text-slate-700 mb-2">扫码转账</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <QRCodeSVG 
                    value={walletAddress} 
                    size={160}
                    level="H"
                  />
                </div>
              </div>

              {/* 右侧：地址和说明 */}
              <div className="space-y-3">
                {/* 地址 */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">收款地址（TRC20-USDT）</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 font-mono text-xs text-slate-900 break-all border border-slate-200">
                      {walletAddress}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(walletAddress)} 
                      className="p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all flex-shrink-0"
                      title="复制地址"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* 使用说明 - 精简 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-bold mb-1.5">💡 使用说明</p>
                  <ol className="text-xs text-blue-700 space-y-1 ml-3 list-decimal">
                    <li>转 USDT 到上方地址（TRC20）</li>
                    <li>系统自动检测并发送 TRX</li>
                    <li>TRX 发送到您的转出地址</li>
                    <li>约需 1-5 分钟完成</li>
                  </ol>
                </div>

                {/* 注意事项 - 精简 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800 font-bold mb-1.5">⚠️ 重要提示</p>
                  {swapNotice ? (
                    <div className="text-xs text-yellow-700 space-y-0.5">
                      {swapNotice.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <ul className="text-xs text-yellow-700 space-y-0.5 ml-3 list-disc">
                      <li>必须使用 TRC20 网络</li>
                      <li>最小金额：10 USDT</li>
                      <li>汇率实时变动</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-1">暂无可用的闪兑钱包</p>
              <p className="text-xs text-slate-400">请联系管理员配置</p>
            </div>
          )}
        </div>

        {/* 广告位 - 两列布局，自动适应行数 */}
        {ads.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad) => (
              <div key={ad._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {ad.type === 'image' && ad.imageUrl ? (
                  <a 
                    href={ad.link || '#'} 
                    target={ad.link ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: `${ad.height}px` }}
                    />
                  </a>
                ) : (
                  <div 
                    className="p-4 flex items-center justify-center text-center"
                    style={{ minHeight: `${ad.height}px` }}
                  >
                    {ad.link ? (
                      <a 
                        href={ad.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:text-cyan-600 transition-colors"
                      >
                        <h3 className="font-bold text-sm mb-1">{ad.title}</h3>
                        <p className="text-xs text-slate-600">{ad.content}</p>
                      </a>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-bold text-sm mb-1">{ad.title}</h3>
                          <p className="text-xs text-slate-600">{ad.content}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapPage;
