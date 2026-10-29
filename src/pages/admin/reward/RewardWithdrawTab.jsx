import { useEffect, useState } from 'react';
import axios, { getApiError } from '../../../api/client';

const STATUS_TEXT = { pending: '待审核', paid: '已打款', rejected: '已驳回' };

export default function RewardWithdrawTab() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (nextStatus = status) => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/rewards/admin/withdraws', { params: { status: nextStatus, limit: 50 } });
      setItems(data.items || []);
    } catch (err) {
      alert(getApiError(err, '加载失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const approve = async (id) => {
    const txHash = window.prompt('链上 TxHash（可留空）') || '';
    try {
      await axios.post(`/api/rewards/admin/withdraws/${id}/approve`, { txHash });
      await load();
    } catch (err) {
      alert(getApiError(err, '操作失败'));
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('驳回原因') || '';
    try {
      await axios.post(`/api/rewards/admin/withdraws/${id}/reject`, { reason });
      await load();
    } catch (err) {
      alert(getApiError(err, '操作失败'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">USDT 提现审核</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="pending">待审核</option>
          <option value="paid">已打款</option>
          <option value="rejected">已驳回</option>
          <option value="all">全部</option>
        </select>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">加载中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">暂无记录</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2">用户</th>
                <th>金额 / 到账</th>
                <th>地址</th>
                <th>状态</th>
                <th>时间</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} className="border-b border-slate-100">
                  <td className="py-2">{row.userId?.username || '-'}</td>
                  <td>{row.amount} / {row.netAmount} USDT</td>
                  <td className="font-mono text-xs break-all">{row.address}</td>
                  <td>{STATUS_TEXT[row.status] || row.status}</td>
                  <td>{new Date(row.createdAt).toLocaleString('zh-CN')}</td>
                  <td className="text-right space-x-2">
                    {row.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => approve(row._id)} className="text-emerald-600 font-bold">打款</button>
                        <button type="button" onClick={() => reject(row._id)} className="text-rose-600 font-bold">驳回</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
