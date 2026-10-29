import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, TrendingUp, Calendar, Download, Search, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, X, Eye } from 'lucide-react';
import axios from '../api/client';
import AdminLayout from '../components/AdminLayout';

const PAYMENT_STATUS = {
  paid: '已支付',
  pending: '待支付',
  failed: '失败',
  expired: '已过期'
};

const TRANSFER_STATUS = {
  completed: '已完成',
  processing: '处理中',
  pending: '待转账',
  failed: '失败'
};

const ORDER_STATUS = {
  pending: '待支付',
  paid: '已支付',
  completed: '已完成',
  failed: '失败'
};

const statusClass = (value) => {
  if (value === 'paid' || value === 'completed') return 'bg-green-50 text-green-600';
  if (value === 'processing') return 'bg-blue-50 text-blue-600';
  if (value === 'pending') return 'bg-yellow-50 text-yellow-600';
  if (value === 'failed' || value === 'expired') return 'bg-red-50 text-red-600';
  return 'bg-slate-50 text-slate-600';
};

const formatTime = (value) => (value ? new Date(value).toLocaleString('zh-CN') : '-');

const FinancePage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    successRate: 0
  });
  const [filter, setFilter] = useState({
    status: 'all',
    payType: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [retryingPayment, setRetryingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/payments/all');
      setPayments(data);
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/payments/stats');
      setStats(data);
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const handleRetryTransfer = async (paymentId) => {
    if (!confirm('确定要手动补单吗？\n\n系统会重新执行代付操作，请确保：\n1. 用户已成功支付\n2. 代付地址正确\n3. 钱包余额充足')) return;

    setRetryingPayment(paymentId);
    try {
      await axios.post(`/api/payments/retry/${paymentId}`);
      alert('✅ 补单成功！\n\n系统已开始重新执行代付，请稍后刷新查看结果。');
      setTimeout(() => {
        fetchPayments();
      }, 3000);
    } catch (error) {
      alert('❌ 补单失败\n\n' + (error.response?.data?.error || error.message));
    } finally {
      setRetryingPayment(null);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter.status !== 'all' && payment.status !== filter.status) return false;
    if (filter.payType !== 'all' && payment.payType !== filter.payType) return false;
    if (filter.search && !payment.address.toLowerCase().includes(filter.search.toLowerCase())
        && !payment.platformOrderId?.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.startDate && new Date(payment.createdAt) < new Date(filter.startDate)) return false;
    if (filter.endDate && new Date(payment.createdAt) > new Date(filter.endDate)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const exportData = () => {
    const csv = [
      ['订单号', '类型', '数量', '地址', '总额(CNY)', '服务费(CNY)', '支付方式', '状态', '支付时间', '代付时间', '交易哈希', '创建时间'],
      ...filteredPayments.map(p => [
        p.platformOrderId || '',
        p.payType,
        p.amount,
        p.address,
        p.totalCNY,
        p.serviceFee || 0,
        p.paymentMethod === 'alipay' ? '支付宝' : '微信',
        p.status,
        p.paymentTime ? new Date(p.paymentTime).toLocaleString('zh-CN') : '',
        p.transferTime ? new Date(p.transferTime).toLocaleString('zh-CN') : '',
        p.txHash || '',
        new Date(p.createdAt).toLocaleString('zh-CN')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `财务报表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      {/* 统计：单行紧凑，去掉假涨幅和重复标题 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="text-blue-600" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">总收入</p>
            <p className="text-base font-bold text-slate-900 leading-tight">¥ {stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp className="text-green-600" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">今日收入</p>
            <p className="text-base font-bold text-slate-900 leading-tight">¥ {stats.todayRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="text-purple-600" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">总订单</p>
            <p className="text-base font-bold text-slate-900 leading-tight">
              {stats.totalOrders.toLocaleString()}
              <span className="ml-1.5 text-xs font-medium text-slate-400">成功率 {stats.successRate}%</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="text-orange-600" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">今日订单</p>
            <p className="text-base font-bold text-slate-900 leading-tight">{stats.todayOrders}</p>
          </div>
        </div>
      </div>

      {/* 筛选和导出 */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">状态</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
            >
              <option value="all">全部</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">类型</label>
            <select
              value={filter.payType}
              onChange={(e) => setFilter({ ...filter, payType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
            >
              <option value="all">全部</option>
              <option value="USDT">USDT</option>
              <option value="TRX">TRX</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">开始日期</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">结束日期</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">搜索</label>
            <div className="relative">
              <input
                type="text"
                placeholder="订单号/地址"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#0095ff] outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={exportData}
            className="bg-[#0095ff] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#007ad6] transition-all"
          >
            <Download size={16} />
            导出报表
          </button>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full" style={{ minWidth: '1600px' }}>
            <colgroup>
              <col style={{ width: '180px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '160px' }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-bold text-slate-600">
                <th className="px-4 py-3 text-left whitespace-nowrap">订单号</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">类型</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">数量</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">地址</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">总额</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">服务费</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">支付方式</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">支付状态</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">转账状态</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">创建时间</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">交易哈希</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-slate-500">
                    加载中...
                  </td>
                </tr>
              ) : currentPayments.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-slate-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                currentPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">
                      {payment.platformOrderId ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(payment)}
                          className="text-[#0095ff] hover:text-[#007ad6] hover:underline"
                        >
                          {payment.platformOrderId}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        payment.payType === 'USDT'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {payment.payType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 whitespace-nowrap">
                      {payment.amount}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 whitespace-nowrap">
                      {payment.address.slice(0, 8)}...{payment.address.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 whitespace-nowrap">
                      ¥ {payment.totalCNY}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right text-orange-600 whitespace-nowrap">
                      ¥ {payment.serviceFee || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                      {payment.paymentMethod === 'alipay' ? '支付宝' : '微信'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass(payment.paymentStatus)}`}>
                        {PAYMENT_STATUS[payment.paymentStatus] || '未知'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass(payment.transferStatus)}`}>
                        {TRANSFER_STATUS[payment.transferStatus] || '未知'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatTime(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {payment.txHash ? (
                        <a
                          href={`https://tronscan.org/#/transaction/${payment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#0095ff] hover:text-[#007ad6]"
                        >
                          {payment.txHash.slice(0, 8)}...{payment.txHash.slice(-4)}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="px-2 py-1 text-xs font-bold text-[#0095ff] hover:bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <Eye size={12} />
                          详情
                        </button>
                        {(payment.transferStatus === 'failed' || payment.transferStatus === 'pending') && payment.paymentStatus === 'paid' ? (
                          <button
                            onClick={() => handleRetryTransfer(payment._id)}
                            disabled={retryingPayment === payment._id}
                            className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="手动补单 - 重新执行代付"
                          >
                            {retryingPayment === payment._id ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                补单中
                              </>
                            ) : (
                              <>
                                <RefreshCw size={12} />
                                补单
                              </>
                            )}
                          </button>
                        ) : payment.transferStatus === 'completed' ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle size={14} />
                            <span className="text-xs font-bold">完成</span>
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页控件 */}
      {filteredPayments.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            显示第 {startIndex + 1} - {Math.min(endIndex, filteredPayments.length)} 条，共 {filteredPayments.length} 条记录
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              上一页
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        currentPage === page
                          ? 'bg-[#0095ff] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2 text-slate-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              下一页
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-base font-bold text-slate-800">订单详情</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">订单号</p>
                <p className="font-mono text-slate-900 break-all">{selectedPayment.platformOrderId || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">类型</p>
                <p className="font-bold text-slate-900">{selectedPayment.payType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">数量</p>
                <p className="font-bold text-slate-900">{selectedPayment.amount}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">代付地址</p>
                <p className="font-mono text-slate-900 break-all">{selectedPayment.address}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">邮箱</p>
                <p className="text-slate-900 break-all">{selectedPayment.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Telegram ID</p>
                <p className="text-slate-900">{selectedPayment.telegramId || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">支付方式</p>
                <p className="text-slate-900">{selectedPayment.paymentMethod === 'alipay' ? '支付宝' : '微信'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">订单状态</p>
                <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass(selectedPayment.status)}`}>
                  {ORDER_STATUS[selectedPayment.status] || '未知'}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">总额</p>
                <p className="font-bold text-slate-900">¥ {selectedPayment.totalCNY}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">服务费</p>
                <p className="font-bold text-orange-600">¥ {selectedPayment.serviceFee || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">支付状态</p>
                <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass(selectedPayment.paymentStatus)}`}>
                  {PAYMENT_STATUS[selectedPayment.paymentStatus] || '未知'}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">支付时间</p>
                <p className="text-slate-900">{formatTime(selectedPayment.paymentTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">转账状态</p>
                <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass(selectedPayment.transferStatus)}`}>
                  {TRANSFER_STATUS[selectedPayment.transferStatus] || '未知'}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">转账时间</p>
                <p className="text-slate-900">{formatTime(selectedPayment.transferTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">出款钱包</p>
                <p className="text-slate-900">{selectedPayment.walletName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">邮件通知</p>
                <p className="text-slate-900">{selectedPayment.emailSent ? '已发送' : '未发送'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">交易哈希</p>
                {selectedPayment.txHash ? (
                  <a
                    href={`https://tronscan.org/#/transaction/${selectedPayment.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#0095ff] hover:text-[#007ad6] break-all"
                  >
                    {selectedPayment.txHash}
                  </a>
                ) : (
                  <p className="text-slate-400">-</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">创建时间</p>
                <p className="text-slate-900">{formatTime(selectedPayment.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default FinancePage;
