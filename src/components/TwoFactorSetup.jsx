import { useState } from 'react';
import QRCode from 'qrcode';
import { Shield, Smartphone, ScanLine, KeyRound, CheckCircle2, Copy } from 'lucide-react';
import api, { getApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TwoFactorGuide from './TwoFactorGuide';

const APPS = ['Google Authenticator', 'Microsoft Authenticator', '1Password', 'Authy'];

export default function TwoFactorSetup({ variant = 'user' }) {
  const { user, updateUser } = useAuth();
  const [secret, setSecret] = useState('');
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const enabled = !!user?.totpEnabled;
  const isAdmin = variant === 'admin';

  const resetDraft = () => {
    setSecret('');
    setQr('');
    setCode('');
    setCopied(false);
  };

  const handleSetup = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { data } = await api.post('/api/auth/2fa/setup');
      setSecret(data.secret);
      setQr(await QRCode.toDataURL(data.otpauth, { width: 220, margin: 1 }));
    } catch (err) {
      setError(getApiError(err, '无法生成绑定二维码'));
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { data } = await api.post('/api/auth/2fa/enable', { code });
      updateUser(data.user);
      resetDraft();
      setMessage('二次验证已启用。之后用密码或 Telegram 登录，都需要验证器里的 6 位数字。');
    } catch (err) {
      setError(getApiError(err, '启用失败'));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { data } = await api.post('/api/auth/2fa/disable', { code });
      updateUser(data.user);
      setCode('');
      setMessage('二次验证已关闭，下次登录不再要求验证码。');
    } catch (err) {
      setError(getApiError(err, '关闭失败'));
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('复制失败，请手动选中密钥');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">二次验证（可选）</h3>
            <p className="text-sm text-slate-500 mt-1">
              {enabled
                ? '已开启。登录时除账号外，还要输入验证器 6 位数字。'
                : '默认关闭。开启后，即使密码泄露，没有手机验证码也无法登录。'}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${enabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {enabled ? '已开启' : '未开启'}
        </span>
      </div>

      {isAdmin && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 space-y-1">
          <p>登录态使用 HttpOnly Cookie，浏览器脚本读不到 token。</p>
          <p>
            管理后台 IP 白名单在服务器环境变量 <code className="font-mono">ADMIN_IP_WHITELIST</code> 中配置，逗号分隔。
          </p>
        </div>
      )}

      {!isAdmin && <TwoFactorGuide defaultOpen={!enabled && !qr} />}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      {!enabled && !qr && (
        <div className="space-y-4">
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <Smartphone size={16} className="mt-0.5 text-cyan-600 shrink-0" />
              <span>手机安装验证器，任选：{APPS.join('、')}</span>
            </li>
            <li className="flex gap-2">
              <ScanLine size={16} className="mt-0.5 text-cyan-600 shrink-0" />
              <span>点击下方按钮，用验证器扫描二维码（无法扫码可手动输入密钥）</span>
            </li>
            <li className="flex gap-2">
              <KeyRound size={16} className="mt-0.5 text-cyan-600 shrink-0" />
              <span>输入验证器里正在跳动的 6 位数字，确认启用</span>
            </li>
          </ol>
          <p className="text-xs text-slate-400">
            用户名/密码和 Telegram 登录都会要求验证码。换手机前请先在验证器里迁移账号，或在本页关闭后再重新绑定。
          </p>
          <button
            type="button"
            onClick={handleSetup}
            disabled={busy}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {busy ? '生成中...' : '开始绑定'}
          </button>
        </div>
      )}

      {!enabled && qr && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-slate-800">用验证器扫描二维码</p>
          <img src={qr} alt="二次验证二维码" className="w-48 h-48 border border-slate-200 rounded-lg bg-white" />
          <div>
            <p className="text-xs text-slate-500 mb-1">无法扫码时，在验证器中选择「手动输入密钥」：</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 break-all">{secret}</code>
              <button
                type="button"
                onClick={copySecret}
                className="shrink-0 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
              >
                <Copy size={14} />
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-2">密钥只显示这一次，请确认已经写入验证器后再往下走。</p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="输入验证器中的 6 位数字"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2"
            autoComplete="one-time-code"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy || code.length !== 6}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-1"
            >
              <CheckCircle2 size={16} />
              确认启用
            </button>
            <button
              type="button"
              onClick={resetDraft}
              disabled={busy}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            关闭前请先打开验证器。需要当前 6 位数字，避免账号被别人关掉这层保护。
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="输入当前验证码以关闭"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2"
            autoComplete="one-time-code"
          />
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy || code.length !== 6}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
          >
            关闭二次验证
          </button>
        </div>
      )}
    </div>
  );
}
