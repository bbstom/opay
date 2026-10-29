import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Save, X, Lock, Eye, EyeOff, Gift, CalendarCheck, Users, Copy, Coins, Sparkles, User, Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios, { getApiError } from '../api/client';
import UserLayout from '../components/UserLayout';
import TwoFactorSetup from '../components/TwoFactorSetup';

const fieldLabel = 'text-sm font-bold text-slate-600 block mb-2';
const fieldInput =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#0095ff] outline-none';

const UserCenterPage = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [userInfo, setUserInfo] = useState({
    email: '',
    username: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [reward, setReward] = useState(null);

  const loadReward = () => axios.get('/api/rewards/me')
    .then(({ data }) => setReward(data))
    .catch(() => setReward(null));

  useEffect(() => {
    if (!user) return;
    setUserInfo({
      email: user.email,
      username: user.username
    });
    loadReward();
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      await axios.put('/api/auth/profile', userInfo);
      updateUser({ ...user, ...userInfo });
      setEditing(false);
      alert('个人信息更新成功');
    } catch (error) {
      alert('更新失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('新密码长度至少为 6 位');
      return;
    }

    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('密码修改成功');
    } catch (error) {
      alert('修改失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setUserInfo({
      email: user.email,
      username: user.username
    });
  };

  const handleCheckin = async () => {
    setChecking(true);
    try {
      const { data } = await axios.post('/api/rewards/checkin');
      alert(data.message || '签到成功');
      await loadReward();
    } catch (err) {
      alert(getApiError(err, '签到失败'));
    } finally {
      setChecking(false);
    }
  };

  const copyInvite = async () => {
    if (!reward?.inviteCode) return;
    const url = `${window.location.origin}/login?invite=${reward.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('复制失败，请手动复制邀请码：' + reward.inviteCode);
    }
  };

  if (!user) return null;

  const registeredAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('zh-CN')
    : '-';
  const checkinReady = reward?.checkinEnabled && !reward?.checkedInToday;
  const inviteUrl = reward?.inviteCode
    ? `${window.location.origin}/login?invite=${reward.inviteCode}`
    : '';

  return (
    <UserLayout>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 text-white p-5 shadow-lg shadow-orange-200">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/80">每日签到</p>
                  <p className="text-xs text-white/70">
                    {reward?.checkedInToday ? '今日已领取，明天再来' : '打开就领，别空手离开'}
                  </p>
                </div>
              </div>
              <p className="text-3xl font-black mb-1">
                +{reward?.checkinTrx ?? 1}
                <span className="text-lg ml-1">TRX</span>
              </p>
              <p className="text-xs text-white/75 mb-4">签到奖励可用来租赁能量</p>
              <button
                type="button"
                disabled={!reward || checking || !checkinReady}
                onClick={handleCheckin}
                className="w-full py-2.5 rounded-xl bg-white text-orange-600 font-black text-sm hover:bg-orange-50 disabled:bg-white/30 disabled:text-white disabled:cursor-not-allowed"
              >
                {!reward
                  ? '加载中...'
                  : reward.checkedInToday
                    ? '今日已签到'
                    : checking
                      ? '领取中...'
                      : `立即签到 +${reward.checkinTrx} TRX`}
              </button>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-5 shadow-lg shadow-cyan-200">
            <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Gift size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/80">邀请奖励</p>
                  <p className="text-xs text-white/70">
                    每人本 +{reward?.inviteSignupTrx ?? 5} TRX，好友消费你拿 {reward?.consumeRewardUsdtPercent ?? 5}% USDT
                  </p>
                </div>
              </div>
              <p className="text-3xl font-black mb-1">
                {reward?.inviteeCount ?? 0}
                <span className="text-lg ml-1">人已加入</span>
              </p>
              <p className="text-xs text-white/75 mb-3 truncate">
                {inviteUrl || '登录后生成专属邀请链接'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!reward?.inviteCode}
                  onClick={copyInvite}
                  className="flex-1 py-2.5 rounded-xl bg-white text-cyan-700 font-black text-sm hover:bg-cyan-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Copy size={16} />
                  {copied ? '已复制' : '复制邀请链接'}
                </button>
                <Link
                  to="/my-rewards"
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 font-bold text-sm flex items-center"
                >
                  详情
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <p className="text-xs font-bold text-slate-500">TRX 余额</p>
            </div>
            <p className="text-2xl font-black text-orange-600">{reward?.trxBalance ?? '--'}</p>
            <p className="text-xs text-slate-400 mt-1">站内消费 · 可租能量</p>
            <Link to="/my-rewards#deposit" className="text-xs font-bold text-orange-600 mt-1 inline-block hover:underline">
              去充值 TRX →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Coins size={16} />
              </div>
              <p className="text-xs font-bold text-slate-500">USDT 奖励</p>
            </div>
            <p className="text-2xl font-black text-emerald-600">{reward?.usdtReward ?? '--'}</p>
            <Link to="/my-rewards" className="text-xs font-bold text-emerald-600 mt-1 inline-block hover:underline">
              可提现 →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Users size={16} />
              </div>
              <p className="text-xs font-bold text-slate-500">邀请人数</p>
            </div>
            <p className="text-2xl font-black text-cyan-600">{reward?.inviteeCount ?? '--'}</p>
            <p className="text-xs text-slate-400 mt-1">人越多，返佣越稳</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-cyan-200 shrink-0">
                  {(user.username || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-slate-800">账户资料</h2>
                  <p className="text-xs text-slate-400">注册于 {registeredAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editing ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center gap-1.5"
                  >
                    <X size={16} />
                    取消
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm"
                  >
                    编辑
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setChangingPassword(!changingPassword)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm flex items-center gap-1.5"
                >
                  {changingPassword ? <X size={16} /> : <Lock size={16} />}
                  {changingPassword ? '取消' : '改密码'}
                </button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className={fieldLabel}>用户名</label>
                  <input
                    type="text"
                    value={userInfo.username}
                    onChange={(e) => setUserInfo({ ...userInfo, username: e.target.value })}
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>邮箱</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className={fieldInput}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Save size={16} />
                  保存修改
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <User size={16} className="text-cyan-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">用户名</p>
                    <p className="font-bold text-slate-800 truncate">{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <Mail size={16} className="text-cyan-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">邮箱</p>
                    <p className="font-bold text-slate-800 truncate">{user.email || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {changingPassword && (
              <div className="space-y-4 mt-5 pt-5 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-700">修改密码</p>
                <div>
                  <label className={fieldLabel}>当前密码</label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={`${fieldInput} pr-12`}
                      placeholder="请输入当前密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={fieldLabel}>新密码</label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={`${fieldInput} pr-12`}
                      placeholder="至少 6 位"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={fieldLabel}>确认新密码</label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`${fieldInput} pr-12`}
                      placeholder="请再次输入"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Lock size={16} />
                  确认修改
                </button>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-lg font-black text-slate-800 mb-1">账户安全</h2>
            <p className="text-sm text-slate-500 mb-4">二次验证保护登录</p>
            <TwoFactorSetup />
          </section>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserCenterPage;
