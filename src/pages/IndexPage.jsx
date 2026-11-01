import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, ArrowRight, Clock, ArrowDownUp, CheckCircle2 } from 'lucide-react';
import axios from '../api/client';
import { USDTIcon, TRXIcon, WechatIcon, AlipayIcon } from '../components/Icons';

const STOCK_HERO = 'photo-1639762681485';

const SERVICES = [
  {
    title: 'USDT 代付',
    desc: '微信 / 支付宝付款，自动把 USDT 打到任意波场地址。',
    path: '/pay',
    tag: 'TRC20',
    icon: USDTIcon,
    tone: 'from-[#E8F7F1] to-white ring-[#26A17B]/20',
  },
  {
    title: 'TRX 代付',
    desc: '同样用法，链上发放 TRX，适合补能量或链上手续费。',
    path: '/pay-trx',
    tag: 'TRC20',
    icon: TRXIcon,
    tone: 'from-[#FFECEC] to-white ring-[#FF060A]/20',
  },
  {
    title: '能量租赁',
    desc: '转入 TRX，自动给指定地址租赁能量，转账更省手续费。',
    path: '/energy-rental',
    tag: 'TRC20',
    icon: Zap,
    tone: 'from-orange-50 to-white ring-orange-200',
    lucide: true,
    iconClass: 'text-orange-500',
  },
  {
    title: '闪兑中心',
    desc: 'USDT 闪兑 TRX，实时汇率，到账原转出地址。',
    path: '/swap',
    tag: 'TRC20',
    icon: ArrowDownUp,
    tone: 'from-cyan-50 to-white ring-cyan-200',
    lucide: true,
    iconClass: 'text-cyan-600',
  },
];

const STEPS = [
  {
    n: '01',
    title: '填写收款地址',
    desc: '粘贴以 T 开头的波场地址。仅 TRC20，填错网络无法到账。',
    tag: 'TRC20',
  },
  {
    n: '02',
    title: '微信或支付宝付款',
    desc: '按页面金额用人民币支付，无需自己持有加密货币。',
    tag: '法币付款',
  },
  {
    n: '03',
    title: '链上自动到账',
    desc: '支付确认后自动转账，无需能量、无需私钥、无需值守。',
    tag: '自动结算',
  },
];

const StepSketch = ({ n }) => {
  if (n === '01') {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-slate-400">收款地址</p>
          <span className="px-1.5 py-px rounded text-[9px] font-black tracking-wider text-white bg-[#FF060A]">TRC20</span>
        </div>
        <p className="font-mono text-[11px] text-slate-700 truncate">TXYZa1b2c3d4e5f6...k9m2</p>
      </div>
    );
  }
  if (n === '02') {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-sky-50 border border-sky-100 text-[11px] font-bold text-sky-700">
          <WechatIcon className="w-3.5 h-3.5" /> 微信
        </div>
        <div className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700">
          <AlipayIcon className="w-3.5 h-3.5" /> 支付宝
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 flex items-center gap-2.5">
      <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
      <div className="min-w-0">
        <p className="text-[11px] font-black text-emerald-700">已到账 100 USDT</p>
        <p className="text-[10px] font-mono text-emerald-600/70 truncate">Tx 8f21a9...c4d0</p>
      </div>
    </div>
  );
};

/** 右侧展示真实工作台形态，不再用无关的区块链配图 */
const WorkbenchPreview = () => (
  <div className="relative">
    <div className="absolute -inset-4 bg-gradient-to-br from-cyan-100/60 via-transparent to-[#26A17B]/10 rounded-3xl blur-2xl" />
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="px-4 py-3.5 border-b bg-gradient-to-r from-[#E8F7F1] via-white to-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white ring-1 ring-[#26A17B]/25 flex items-center justify-center shadow-sm">
            <USDTIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black text-slate-900">USDT 代付</p>
              <span className="px-1.5 py-px rounded text-[10px] font-black tracking-wider text-white bg-[#FF060A]">TRC20</span>
            </div>
            <p className="text-[11px] text-slate-500">仅支持波场网络 · 自动链上转账</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">实时结算</span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[11px] font-bold text-slate-500 mb-1">收款地址</p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-700 truncate">
            TXYZabcd...TRC20
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-1">代付数量</p>
            <p className="text-lg font-black text-slate-900 tabular-nums">100.00 <span className="text-xs text-[#26A17B]">USDT</span></p>
          </div>
          <p className="text-[11px] font-bold text-slate-400">约合 ¥ 735.00</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-sky-200 bg-sky-50 text-xs font-bold text-sky-700">
            <WechatIcon className="w-4 h-4" /> 微信
          </div>
          <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
            <AlipayIcon className="w-4 h-4" /> 支付宝
          </div>
        </div>
        <div className="w-full py-2.5 rounded-lg bg-cyan-500 text-white text-sm font-black text-center">
          立即支付
        </div>
      </div>
    </div>
  </div>
);

const IndexPage = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [heroImage, setHeroImage] = useState('');
  const [siteName, setSiteName] = useState('可可代付');
  const [siteDescription, setSiteDescription] = useState('支持通过微信、支付宝为任意波场地址发放 USDT 或 TRX，无需私钥，无需自行购买能量。');

  useEffect(() => {
    axios.get('/api/ads').then((res) => setAds(res.data)).catch(console.error);
    axios.get('/api/settings/public').then((res) => {
      if (res.data.homeHeroImage) setHeroImage(res.data.homeHeroImage);
      if (res.data.siteName) setSiteName(res.data.siteName);
      if (res.data.siteDescription) setSiteDescription(res.data.siteDescription);
    }).catch(console.error);
  }, []);

  const getAdsByPosition = (position) =>
    ads.filter((ad) => ad.position === position && ad.isActive).sort((a, b) => a.order - b.order);

  const useCustomHero = heroImage && !heroImage.includes(STOCK_HERO);

  return (
    <div className="animate-in fade-in duration-700">
      <section className="relative pt-16 pb-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[320px] bg-gradient-to-b from-cyan-50/70 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-cyan-100 shadow-sm">
              <span className="px-1.5 py-px rounded text-[10px] font-black tracking-wider text-white bg-[#FF060A]">TRC20</span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="text-[11px] font-medium text-slate-500">仅支持波场网络 · 自动结算</span>
            </div>
            <h1 className="text-3xl lg:text-[34px] font-black text-slate-900 leading-[1.2] tracking-tight">
              让链上支付
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">像发红包一样简单</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium max-w-xl leading-relaxed">
              {siteName} {siteDescription}
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button onClick={() => navigate('/pay')} className="bg-cyan-500 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-cyan-600 transition-all text-sm">
                USDT 代付 <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('/pay-trx')} className="bg-white border border-cyan-500 text-cyan-600 px-4 py-2.5 rounded-lg font-bold hover:bg-cyan-50 transition-all text-sm">
                TRX 代付
              </button>
              <button onClick={() => navigate('/energy-rental')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition-all text-sm">
                能量租赁
              </button>
              <button onClick={() => navigate('/swap')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition-all text-sm">
                闪兑中心
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400">
              <span>微信 / 支付宝</span>
              <span>TRC20 专网</span>
              <span>无需私钥</span>
              <span>无需自行买能量</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            {useCustomHero ? (
              <div className="relative bg-white/40 backdrop-blur-xl border border-white p-2 rounded-xl shadow-lg">
                <img src={heroImage} alt={`${siteName} 工作台`} className="rounded-lg shadow-sm w-full object-cover" />
              </div>
            ) : (
              <WorkbenchPreview />
            )}
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[11px] font-black tracking-widest text-cyan-600 uppercase mb-1">Services</p>
              <h2 className="text-lg font-black text-slate-900">四项核心服务，同一张波场网</h2>
            </div>
            <span className="hidden sm:inline-flex px-2 py-1 rounded-md text-[10px] font-black tracking-wider text-white bg-[#FF060A]">TRC20</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`text-left rounded-xl border border-slate-100 ring-1 p-4 bg-gradient-to-b ${item.tone} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      {item.lucide ? <Icon className={item.iconClass} size={20} /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className="px-1.5 py-px rounded text-[10px] font-black tracking-wider text-[#FF060A] bg-[#FFE8E8]">{item.tag}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                  <span className="text-xs font-bold text-cyan-600 inline-flex items-center gap-1">
                    立即使用 <ArrowRight size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-cyan-50/40 to-white -z-10" />
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
            <div>
              <p className="text-[11px] font-black tracking-widest text-cyan-600 uppercase mb-1">How it works</p>
              <h2 className="text-xl font-black text-slate-900">三步完成一笔代付</h2>
              <p className="text-sm text-slate-500 mt-1">法币进、链上出。全程不碰私钥，不需要自己买能量。</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pay')}
              className="self-start md:self-auto bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 hover:bg-cyan-600 transition-all"
            >
              去工作台下单 <ArrowRight size={14} />
            </button>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="hidden md:block absolute top-[22px] left-[18%] right-[18%] h-[2px] bg-gradient-to-r from-cyan-200 via-cyan-400 to-emerald-300" />
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-black flex items-center justify-center shadow-lg shadow-cyan-200/70 ring-4 ring-white">
                    {i + 1}
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-100">
                    {step.tag}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{step.desc}</p>
                <StepSketch n={step.n} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: '全自动结算', icon: <Zap className="text-amber-500" size={18} />, desc: '支付确认后自动触发链上转账，全天候处理，无需值守。' },
            { title: '资金链路隔离', icon: <ShieldCheck className="text-blue-500" size={18} />, desc: '代付流水独立监控，地址校验后再出款，降低填错风险。' },
            { title: 'TRC20 专网', icon: <Clock className="text-cyan-500" size={18} />, desc: 'USDT、TRX、能量、闪兑全部走波场 TRC20，不支持 ERC20 / BEP20。' },
          ].map((item) => (
            <div key={item.title} className="space-y-2 text-center md:text-left">
              <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {getAdsByPosition('home-bottom').length > 0 && (
        <section className="py-8 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-base font-bold text-slate-800 mb-4">合作伙伴</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getAdsByPosition('home-bottom').slice(0, 9).map((ad) => (
                <div
                  key={ad._id}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  style={{ height: `${ad.height}px` }}
                >
                  {ad.link ? (
                    <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      {ad.type === 'image' ? (
                        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                          <p className="text-sm font-medium text-slate-700 line-clamp-3">{ad.content}</p>
                        </div>
                      )}
                    </a>
                  ) : (
                    <div className="w-full h-full">
                      {ad.type === 'image' ? (
                        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                          <p className="text-sm font-medium text-slate-700 line-clamp-3">{ad.content}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default IndexPage;
