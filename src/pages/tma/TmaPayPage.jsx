import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useSettingsOptional } from '../../context/SettingsContext';
import axios from '../../api/client';
import { AlipayIcon, WechatIcon, USDTIcon } from '../../components/Icons';
import { quoteServiceFee } from '../../utils/tieredFee';
import { bootTelegramWebApp } from '../../tma/telegramWebApp';

const QUICK_AMOUNTS = [10, 50, 100, 500];

const TmaPayPage = () => {
  const { telegramWebAppLogin } = useAuth();
  const settingsCtx = useSettingsOptional();
  const [tg, setTg] = useState(null);
  const [settings, setSettings] = useState(settingsCtx?.settings || null);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [order, setOrder] = useState(null);
  const submitRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const webApp = await bootTelegramWebApp();
      if (cancelled) return;
      setTg(webApp);
      if (webApp?.initData) {
        try {
          await telegramWebAppLogin(webApp.initData);
        } catch {
          // 浏览器预览或校验失败时按游客下单
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (settingsCtx?.settings) setSettings(settingsCtx.settings);
  }, [settingsCtx?.settings]);

  useEffect(() => {
    if (!settings) return;
    if (paymentMethod === 'wechat' && settings.paymentWechatEnabled === false && settings.paymentAlipayEnabled) {
      setPaymentMethod('alipay');
    }
    if (paymentMethod === 'alipay' && !settings.paymentAlipayEnabled && settings.paymentWechatEnabled !== false) {
      setPaymentMethod('wechat');
    }
  }, [settings, paymentMethod]);

  const quote = useMemo(() => quoteServiceFee(amount, 'USDT', settings), [amount, settings]);
  const rate = settings?.exchangeRateUSDT || 7.35;
  const cny = ((Number(amount) || 0) * rate).toFixed(2);
  const total = quote.totalCNY ? Number(quote.totalCNY).toFixed(2) : ((Number(cny) || 0) + (Number(quote.serviceFee) || 0)).toFixed(2);
  const addressOk = /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address.trim());
  const canSubmit = addressOk && Number(amount) > 0 && !quote.error && !loading;

  useEffect(() => {
    if (!tg?.MainButton) return undefined;
    const onClick = () => submitRef.current?.();
    tg.MainButton.onClick(onClick);
    return () => {
      try {
        tg.MainButton.offClick(onClick);
        tg.MainButton.hide();
      } catch {
        // ignore
      }
    };
  }, [tg]);

  useEffect(() => {
    if (!tg?.MainButton) return;
    if (order) {
      tg.MainButton.hide();
      return;
    }
    if (canSubmit) {
      tg.MainButton.setText('立即支付');
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  }, [tg, canSubmit, order]);

  useEffect(() => {
    if (!order?.orderId) return undefined;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/payments/order/${order.orderId}`);
        if (stopped) return;
        if (data.paymentStatus === 'paid' && data.status !== 'completed') {
          setNotice({ type: 'ok', title: '支付成功', text: '正在处理 USDT 代付，预计 2-10 分钟到账' });
        }
        if (data.status === 'completed') {
          stopped = true;
          setNotice({ type: 'ok', title: '代付完成', text: `${data.amount} USDT 已转出` });
          setOrder(null);
          try { tg?.HapticFeedback?.notificationOccurred('success'); } catch { /* ignore */ }
        }
        if (data.status === 'failed') {
          stopped = true;
          setNotice({ type: 'err', title: '代付失败', text: '转账失败，请联系客服' });
        }
      } catch {
        // 轮询失败下次再试
      }
    }, 3000);
    const timeout = setTimeout(() => {
      stopped = true;
      clearInterval(timer);
    }, 300000);
    return () => {
      stopped = true;
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [order?.orderId, tg]);

  const handleSubmit = async () => {
    setError('');
    if (!addressOk) {
      setError('请输入有效的波场地址（T 开头）');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('请输入代付数量');
      return;
    }
    if (quote.error) {
      setError(quote.error);
      return;
    }
    if (paymentMethod === 'alipay' && !settings?.paymentAlipayEnabled) {
      setError('支付宝暂未开通，请选微信');
      return;
    }
    if (paymentMethod === 'wechat' && settings?.paymentWechatEnabled === false) {
      setError('微信暂未开通，请选支付宝');
      return;
    }
    setLoading(true);
    try {
      tg?.HapticFeedback?.impactOccurred('medium');
      const { data } = await axios.post('/api/payments', {
        payType: 'USDT',
        amount: parseFloat(amount),
        address: address.trim(),
        email: null,
        paymentMethod,
        totalCNY: parseFloat(total),
        telegramId: tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : undefined
      });
      if (!data.paymentUrl) {
        setError('支付链接获取失败，请检查支付通道');
        return;
      }
      setOrder({
        orderId: data.orderId,
        paymentUrl: data.paymentUrl,
        total
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };
  submitRef.current = handleSubmit;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: 'ok', title: '已复制', text: '可粘贴到微信 / 支付宝打开' });
    } catch {
      setError('复制失败，请长按选择');
    }
  };

  const openPayLink = () => {
    if (!order?.paymentUrl) return;
    if (tg?.openLink) tg.openLink(order.paymentUrl);
    else window.open(order.paymentUrl, '_blank', 'noopener,noreferrer');
  };

  const theme = {
    bg: tg?.themeParams?.bg_color || '#eef3f8',
    card: tg?.themeParams?.secondary_bg_color || '#ffffff',
    text: tg?.themeParams?.text_color || '#0a1224',
    hint: tg?.themeParams?.hint_color || '#64748b',
    button: tg?.themeParams?.button_color || '#0095ff',
    buttonText: tg?.themeParams?.button_text_color || '#ffffff'
  };
  const logo = settings?.siteLogo || '/opaylog.jpg';
  const siteName = settings?.siteName || '可可代付';

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">加载中...</div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: theme.bg,
        color: theme.text,
        paddingTop: 'calc(12px + var(--tg-content-safe-area-inset-top, 0px))',
        paddingBottom: 'calc(24px + var(--tg-safe-area-inset-bottom, 0px))'
      }}
    >
      <div className="max-w-md mx-auto px-4 space-y-3">
        <div className="flex items-center gap-3 pt-1">
          <img src={logo} alt="" className="w-10 h-10 rounded-xl object-cover bg-white" />
          <div>
            <div className="text-base font-black">{siteName}</div>
            <div className="text-xs" style={{ color: theme.hint }}>USDT 代付</div>
          </div>
        </div>

        {order ? (
          <div className="rounded-2xl p-4 space-y-4" style={{ background: theme.card }}>
            <div className="text-center">
              <div className="text-xs" style={{ color: theme.hint }}>应付金额</div>
              <div className="text-3xl font-black mt-1">¥ {order.total}</div>
              <div className="text-xs mt-1" style={{ color: theme.hint }}>
                {paymentMethod === 'alipay' ? '支付宝' : '微信'} · {order.orderId}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeSVG value={order.paymentUrl} size={180} />
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: theme.hint }}>
              手机里可截图后用微信 / 支付宝扫码，或复制链接到对应 App 打开
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyText(order.paymentUrl)}
                className="py-3 rounded-xl font-bold text-sm bg-slate-100"
              >
                复制链接
              </button>
              <button
                type="button"
                onClick={openPayLink}
                className="py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: theme.button, color: theme.buttonText }}
              >
                打开支付
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOrder(null)}
              className="w-full py-2 text-xs"
              style={{ color: theme.hint }}
            >
              返回修改订单
            </button>
            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: theme.hint }}>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              正在监听支付状态
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 space-y-4" style={{ background: theme.card }}>
            <div>
              <label className="text-xs font-bold mb-1.5 block">收款地址</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value.trim())}
                placeholder="T 开头的波场地址"
                className="w-full rounded-xl px-3 py-3 text-sm font-mono outline-none bg-slate-50 border border-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block">代付数量</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入数量"
                  className="w-full rounded-xl px-3 py-3 pr-16 text-sm font-bold outline-none bg-slate-50 border border-slate-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-[#26A17B] bg-[#E6F4EF] px-2 py-0.5 rounded-lg">
                  USDT
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {QUICK_AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(String(n))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                      String(n) === amount ? 'bg-sky-100 text-sky-700' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs" style={{ color: theme.hint }}>
                <span>汇率 1 USDT = {rate.toFixed(2)} CNY</span>
                {amount ? <span>约合 ¥ {cny}</span> : null}
              </div>
              {quote.error ? (
                <div className="mt-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {quote.error}
                </div>
              ) : null}
            </div>

            <div>
              <div className="text-xs font-bold mb-1.5">支付方式</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wechat')}
                  className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border ${
                    paymentMethod === 'wechat' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <WechatIcon className="w-5 h-5" />
                  微信
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('alipay')}
                  className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border ${
                    paymentMethod === 'alipay' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <AlipayIcon className="w-5 h-5" />
                  支付宝
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: theme.hint }}>代付</span>
                <span className="font-bold flex items-center gap-1">
                  <USDTIcon className="w-4 h-4" />
                  {amount ? Number(amount).toFixed(2) : '--'} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: theme.hint }}>服务费 {quote.feeLabel}</span>
                <span className="font-bold text-orange-500">{amount ? `¥ ${Number(quote.serviceFee).toFixed(2)}` : '--'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="font-bold">应付</span>
                <span className="text-xl font-black">¥ {amount ? total : '--'}</span>
              </div>
            </div>

            {error ? <div className="text-xs font-bold text-red-600">{error}</div> : null}

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40"
              style={{ background: theme.button, color: theme.buttonText }}
            >
              {loading ? '创建订单中...' : '立即支付'}
            </button>
            <p className="text-[11px] text-center" style={{ color: theme.hint }}>
              请核对地址，转账后无法撤销
            </p>
          </div>
        )}
      </div>

      {notice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40" onClick={() => setNotice(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className={`text-base font-black ${notice.type === 'ok' ? 'text-slate-900' : 'text-red-700'}`}>
              {notice.title}
            </div>
            <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{notice.text}</p>
            <button
              type="button"
              className="mt-4 w-full py-2.5 rounded-xl font-bold text-white"
              style={{ background: theme.button }}
              onClick={() => setNotice(null)}
            >
              知道了
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TmaPayPage;
