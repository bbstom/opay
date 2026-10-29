import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Gift, Copy, CheckCircle2, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios, { getApiError } from '../api/client';
import UserLayout from '../components/UserLayout';

const LEDGER_LABEL = {
  checkin: '每日签到',
  invite_signup: '邀请注册',
  consume_reward: '下级消费返佣',
  energy_spend: '能量租赁扣款',
  energy_refund: '能量租赁退款',
  withdraw_hold: '提现冻结',
  withdraw_reject: '提现退回',
  trx_deposit: 'TRX 充值'
};

const WITHDRAW_LABEL = {
  pending: '待审核',
  paid: '已打款',
  rejected: '已驳回'
};

const copyText = async (text) => {
  await navigator.clipboard.writeText(text);
  alert('已复制');
};

const MyRewardsPage = () => {
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [invitees, setInvitees] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [depositHash, setDepositHash] = useState('');
  const [depositing, setDepositing] = useState(false);

  const loadAll = async () => {
    const [me, led, inv, wd] = await Promise.all([
      axios.get('/api/rewards/me'),
      axios.get('/api/rewards/ledger', { params: { limit: 20 } }),
      axios.get('/api/rewards/invitees', { params: { limit: 10 } }),
      axios.get('/api/rewards/withdraws', { params: { limit: 10 } })
    ]);
    setSummary(me.data);
    setLedger(led.data.items || []);
    setInvitees(inv.data.items || []);
    setWithdraws(wd.data.items || []);
  };

  useEffect(() => {
    loadAll()
      .catch((err) => alert(getApiError(err, '加载失败')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !summary || location.hash !== '#deposit') return;
    document.getElementById('deposit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, summary, location.hash]);

  const handleCheckin = async () => {
    setChecking(true);
    try {
      const { data } = await axios.post('/api/rewards/checkin');
      alert(data.message || '签到成功');
      await loadAll();
    } catch (err) {
      alert(getApiError(err, '签到失败'));
    } finally {
      setChecking(false);
    }
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    try {
      await axios.post('/api/rewards/withdraw', {
        amount: Number(withdrawForm.amount),
        address: withdrawForm.address.trim()
      });
      alert('提现已提交，请等待审核打款');
      setWithdrawForm({ amount: '', address: '' });
      await loadAll();
    } catch (err) {
      alert(getApiError(err, '提现失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async () => {
    setDepositing(true);
    try {
      const { data } = await axios.post('/api/rewards/deposit', { txHash: depositHash.trim() });
      alert(data.message || '充值成功');
      setDepositHash('');
      await loadAll();
    } catch (err) {
      alert(getApiError(err, '充值失败'));
    } finally {
      setDepositing(false);
    }
  };

  if (loading || !summary) {
    return (
      <UserLayout>
        <p className="text-sm text-slate-500 text-center py-12">加载中...</p>
      </UserLayout>
    );
  }

  const webInviteUrl = `${window.location.origin}/login?invite=${summary.inviteCode}`;

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">TRX 余额（可消费）</p>
            <p className="text-2xl font-black text-orange-600">{summary.trxBalance} TRX</p>
            <p className="text-xs text-slate-400 mt-1">签到、邀请、自行充值，可用于租赁能量</p>
            <button
              type="button"
              disabled={checking || summary.checkedInToday || !summary.checkinEnabled}
              onClick={handleCheckin}
              className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-lg text-sm font-bold"
            >
              {summary.checkedInToday ? '今日已签到' : `签到 +${summary.checkinTrx} TRX`}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">USDT 奖励（可提现）</p>
            <p className="text-2xl font-black text-emerald-600">{summary.usdtReward} USDT</p>
            <p className="text-xs text-slate-400 mt-1">
              下级消费返 {summary.consumeRewardUsdtPercent}% · 最低提现 {summary.withdrawMinUsdt} USDT
              {summary.withdrawFeeUsdt > 0 ? ` · 手续费 ${summary.withdrawFeeUsdt}` : ''}
            </p>
            <div className="mt-3 space-y-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                placeholder="提现金额"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                value={withdrawForm.address}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, address: e.target.value })}
                placeholder="USDT-TRC20 收款地址"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                disabled={submitting}
                onClick={handleWithdraw}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold"
              >
                {submitting ? '提交中...' : '申请提现'}
              </button>
            </div>
          </div>
        </div>

        <div id="deposit" className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-orange-600" />
            <h2 className="text-base font-black text-slate-800">充值 TRX</h2>
          </div>
          {!summary.trxDepositEnabled ? (
            <p className="text-xs text-slate-400">充值暂未开启，请联系管理员</p>
          ) : !summary.trxDepositAddress ? (
            <p className="text-xs text-slate-400">管理员尚未配置充值地址</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
              <div className="bg-white p-2 rounded-lg border border-slate-100 w-fit">
                <QRCodeSVG value={summary.trxDepositAddress} size={132} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  转到下方地址后粘贴交易哈希入账，最低 {summary.trxDepositMin} TRX。入账后可在能量租赁页用余额付款。
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs break-all">
                    {summary.trxDepositAddress}
                  </div>
                  <button type="button" onClick={() => copyText(summary.trxDepositAddress)} className="p-2 bg-orange-500 text-white rounded-lg">
                    <Copy size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={depositHash}
                  onChange={(e) => setDepositHash(e.target.value)}
                  placeholder="交易哈希 TxID"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  disabled={depositing || !depositHash.trim()}
                  onClick={handleDeposit}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold"
                >
                  {depositing ? '入账中...' : '提交哈希入账'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={18} className="text-cyan-600" />
            <h2 className="text-base font-black text-slate-800">邀请好友</h2>
            <span className="text-xs text-slate-400">已邀请 {summary.inviteeCount} 人 · 每人本 +{summary.inviteSignupTrx} TRX</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm">{summary.inviteCode}</div>
            <button type="button" onClick={() => copyText(summary.inviteCode)} className="p-2 bg-cyan-500 text-white rounded-lg">
              <Copy size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs break-all">{webInviteUrl}</div>
            <button type="button" onClick={() => copyText(webInviteUrl)} className="p-2 bg-cyan-500 text-white rounded-lg">
              <Copy size={16} />
            </button>
          </div>
          {summary.telegramInviteUrl && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs break-all">{summary.telegramInviteUrl}</div>
              <button type="button" onClick={() => copyText(summary.telegramInviteUrl)} className="p-2 bg-cyan-500 text-white rounded-lg">
                <Copy size={16} />
              </button>
            </div>
          )}
          {invitees.length > 0 && (
            <div className="mt-3 text-xs text-slate-500 space-y-1">
              {invitees.map((u) => (
                <p key={u._id}>{u.username} · {new Date(u.createdAt).toLocaleDateString('zh-CN')}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-black text-slate-800 mb-3">提现记录</h3>
          {withdraws.length === 0 ? (
            <p className="text-xs text-slate-400">暂无提现</p>
          ) : (
            <div className="space-y-2 text-xs">
              {withdraws.map((w) => (
                <div key={w._id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <span>{w.amount} USDT → {w.address.slice(0, 8)}...{w.address.slice(-4)}</span>
                  <span className="text-slate-500">{WITHDRAW_LABEL[w.status] || w.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-black text-slate-800 mb-3">资金流水</h3>
          {ledger.length === 0 ? (
            <p className="text-xs text-slate-400">暂无流水</p>
          ) : (
            <div className="space-y-2 text-xs">
              {ledger.map((row) => (
                <div key={row._id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-1">
                    {row.amount > 0 ? <CheckCircle2 size={12} className="text-emerald-500" /> : null}
                    {LEDGER_LABEL[row.type] || row.type}
                  </span>
                  <span className={row.amount > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {row.amount > 0 ? '+' : ''}{row.amount} {row.asset}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default MyRewardsPage;
