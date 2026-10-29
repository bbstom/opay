import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';
import { getApiError } from '../api/client';

const postLoginPath = () => {
  const raw = new URLSearchParams(window.location.search).get('redirect');
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/user-center';
};

const LoginPage = () => {
  const { login, verifyTwoFactor, register, sendRegisterCode, sendResetCode, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '', code: '', inviteCode: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loginToken, setLoginToken] = useState('');
  const [qrCodeExpired, setQrCodeExpired] = useState(false);
  const [botUsername, setBotUsername] = useState('');
  const pollRef = useRef(null);
  const expireRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (expireRef.current) {
      clearTimeout(expireRef.current);
      expireRef.current = null;
    }
  };

  const startPolling = (token) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/check-qr-login?token=${token}`, { credentials: 'include' });
        const data = await response.json();

        if (data.success && data.token) {
          stopPolling();
          try {
            const completeResponse = await fetch('/api/auth/qr-login-complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ token: data.token })
            });
            const completeData = await completeResponse.json();
            if (completeResponse.ok && completeData.requiresTwoFactor) {
              setShowQRCode(false);
              setMode('2fa');
              return;
            }
            if (completeResponse.ok) {
              window.location.href = postLoginPath();
            } else {
              setError(completeData.error || '登录失败，请重试');
            }
          } catch (err) {
            setError('登录失败，请重试');
          }
        }
      } catch (err) {
        // 网络抖动时继续轮询
      }
    }, 2000);

    expireRef.current = setTimeout(() => {
      stopPolling();
      setQrCodeExpired(true);
    }, 120000);
  };

  const handleTelegramAppLogin = () => {
    if (!botUsername) {
      setError('未在后台配置 Telegram Bot');
      return;
    }
    const token = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setLoginToken(token);
    window.location.href = `tg://resolve?domain=${botUsername}&start=${token}`;
    startPolling(token);
    setError('请在 Telegram 中点击“确认登录”按钮');
  };

  const generateQRCode = async () => {
    try {
      if (!botUsername) {
        setError('未在后台配置 Telegram Bot');
        return;
      }
      const token = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setLoginToken(token);

      const deepLink = `https://t.me/${botUsername}?start=${token}`;
      const qrDataUrl = await QRCode.toDataURL(deepLink, {
        width: 280,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      setQrCodeUrl(qrDataUrl);
      setShowQRCode(true);
      setQrCodeExpired(false);
      setError('');
      startPolling(token);
    } catch (err) {
      setError('生成二维码失败，请重试');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      if (mode === 'reset') {
        if (formData.password !== formData.confirmPassword) {
          setError('两次密码不一致');
          return;
        }
        await resetPassword(formData.email, formData.code, formData.password);
        setInfo('密码已重置，请使用新密码登录');
        setMode('login');
        setFormData({ ...formData, password: '', confirmPassword: '', code: '' });
        return;
      }
      if (mode === '2fa') {
        await verifyTwoFactor(formData.code);
        window.location.href = postLoginPath();
        return;
      }
      if (mode === 'login') {
        const data = await login(formData.username, formData.password);
        if (data.requiresTwoFactor) {
          setMode('2fa');
          setFormData({ ...formData, code: '' });
          return;
        }
      } else {
        await register(formData.username, formData.email, formData.password, formData.code, formData.inviteCode);
      }
      window.location.href = postLoginPath();
    } catch (err) {
      setError(getApiError(err, '操作失败'));
    }
  };

  const handleSendCode = async () => {
    setError('');
    setInfo('');
    if (!formData.email) {
      setError('请先填写邮箱');
      return;
    }
    setSendingCode(true);
    try {
      if (mode === 'reset') {
        await sendResetCode(formData.email);
      } else {
        await sendRegisterCode(formData.email);
      }
      setCodeCountdown(60);
      setInfo('验证码已发送，请查收邮箱');
    } catch (err) {
      setError(getApiError(err, '验证码发送失败'));
    } finally {
      setSendingCode(false);
    }
  };

  useEffect(() => {
    if (codeCountdown <= 0) return undefined;
    const timer = setTimeout(() => setCodeCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCountdown]);

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((d) => setBotUsername(String(d.telegramBotUsername || '').replace(/^@+/, '')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get('invite');
    if (!invite) return;
    setFormData((prev) => ({ ...prev, inviteCode: invite.toUpperCase() }));
    setMode('register');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {showQRCode ? '扫码登录' : mode === 'login' ? '登录账户' : mode === 'register' ? '注册账户' : '重置密码'}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm font-bold">{error}</div>}
          {info && <div className="bg-cyan-50 text-cyan-700 px-4 py-2 rounded-lg mb-4 text-sm font-bold">{info}</div>}

          {showQRCode ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0088cc] flex items-center justify-center shadow-lg shadow-sky-200">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.169.523-.506.697-.831.715-.704.031-1.238-.465-1.92-.911-.106-.07-2.022-1.294-2.726-1.892-.193-.164-.41-.492-.013-.876.917-.886 2.014-1.877 2.68-2.537.297-.295.594-.984-.652-.145-1.784 1.201-3.527 2.368-3.527 2.368s-.414.263-.119.263c.295 0 4.343-1.411 4.343-1.411s.801-.314.801.209z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-black text-slate-800">Telegram 扫码</div>
                  <div className="text-xs text-slate-400">打开 App 扫描二维码</div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-8 bg-[#0088cc]/20 blur-2xl rounded-full pointer-events-none" />
                <div className={`relative p-5 rounded-3xl border bg-gradient-to-br from-[#E8F6FF] via-white to-sky-50 ${qrCodeExpired ? 'border-red-200' : 'border-sky-100'}`}>
                  <div className="relative bg-white p-3 rounded-2xl shadow-sm">
                    <span className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-[3px] border-l-[3px] border-[#0088cc] rounded-tl-md" />
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-[3px] border-r-[3px] border-[#0088cc] rounded-tr-md" />
                    <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-[3px] border-l-[3px] border-[#0088cc] rounded-bl-md" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-[3px] border-r-[3px] border-[#0088cc] rounded-br-md" />
                    {qrCodeExpired && (
                      <button
                        type="button"
                        onClick={generateQRCode}
                        className="absolute inset-0 z-10 bg-white/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center gap-3"
                      >
                        <span className="w-12 h-12 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-lg shadow-sky-200">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 12a9 9 0 1 1-2.3-6" />
                            <path d="M21 3v6h-6" />
                          </svg>
                        </span>
                        <span className="text-sm font-bold text-slate-700">二维码已过期，点击刷新</span>
                      </button>
                    )}
                    <img src={qrCodeUrl} alt="登录二维码" className="w-56 h-56" />
                  </div>
                </div>
              </div>

              {!qrCodeExpired && (
                <div className="mt-5 flex items-center gap-2 text-[#0088cc]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#0088cc] opacity-40 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0088cc]" />
                  </span>
                  <span className="text-xs font-bold tracking-wide">等待确认</span>
                </div>
              )}

              <div className="w-full mt-6 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowQRCode(false);
                    setError('');
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-[#0088cc] hover:bg-sky-50 transition-all"
                >
                  使用用户名登录
                </button>
              </div>
            </div>
          ) : (
            <>
              {mode !== 'reset' && mode !== '2fa' && (
              <div className="mb-6">
                <div className="text-center mb-3">
                  <span className="text-sm font-bold text-slate-600">使用 Telegram 快速登录</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleTelegramAppLogin}
                    className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-2.5 px-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.169.523-.506.697-.831.715-.704.031-1.238-.465-1.92-.911-.106-.07-2.022-1.294-2.726-1.892-.193-.164-.41-.492-.013-.876.917-.886 2.014-1.877 2.68-2.537.297-.295.594-.984-.652-.145-1.784 1.201-3.527 2.368-3.527 2.368s-.414.263-.119.263c.295 0 4.343-1.411 4.343-1.411s.801-.314.801.209z"/>
                    </svg>
                    <span>Telegram 登录</span>
                  </button>
                  <button
                    onClick={generateQRCode}
                    className="bg-white hover:bg-slate-50 text-[#0088cc] font-bold py-2.5 px-3 rounded-lg transition-all border-2 border-[#0088cc] flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    <span>Telegram 扫码</span>
                  </button>
                </div>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-bold">或使用用户名登录</span>
                  </div>
                </div>
              </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode !== 'reset' && mode !== '2fa' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">用户名</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                    autoComplete="username"
                    required
                  />
                </div>
                )}
                {(mode === 'register' || mode === 'reset') && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">邮箱</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">邮箱验证码</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                          autoComplete="one-time-code"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={sendingCode || codeCountdown > 0}
                          className="shrink-0 px-4 rounded-lg border-2 border-cyan-500 text-cyan-600 font-bold text-sm hover:bg-cyan-50 disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                        >
                          {codeCountdown > 0 ? `${codeCountdown}s` : sendingCode ? '发送中' : '发送验证码'}
                        </button>
                      </div>
                    </div>
                    {mode === 'register' && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">邀请码（选填）</label>
                      <input
                        type="text"
                        value={formData.inviteCode}
                        onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                        autoComplete="off"
                      />
                    </div>
                    )}
                  </>
                )}
                {mode === '2fa' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">二次验证码</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none tracking-widest text-center text-lg"
                      autoComplete="one-time-code"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-2 text-center">打开手机验证器，填写正在跳动的 6 位数字（约 30 秒变一次）</p>
                  </div>
                )}
                {mode !== '2fa' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{mode === 'reset' ? '新密码' : '密码'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                </div>
                )}
                {mode === 'reset' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">确认新密码</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                )}
                {mode === 'login' && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); setInfo(''); }}
                      className="text-xs text-slate-400 hover:text-cyan-600 font-bold"
                    >
                      忘记密码？
                    </button>
                  </div>
                )}
                <button type="submit" className="w-full bg-cyan-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-cyan-600 transition-all shadow-lg">
                  {mode === 'login' ? '登录' : mode === 'register' ? '注册' : mode === '2fa' ? '验证并登录' : '重置密码'}
                </button>
              </form>

              <div className="text-center mt-6">
                {mode === 'reset' || mode === '2fa' ? (
                  <button onClick={() => { setMode('login'); setError(''); setInfo(''); }} className="text-sm text-slate-500 hover:text-cyan-600 font-bold">
                    返回登录
                  </button>
                ) : (
                  <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }} className="text-sm text-slate-500 hover:text-cyan-600 font-bold">
                    {mode === 'login' ? '还没有账户？立即注册' : '已有账户？立即登录'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
