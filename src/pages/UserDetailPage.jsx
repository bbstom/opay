import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Shield, Activity, DollarSign, Package } from 'lucide-react';
import axios from '../api/client';
import AdminLayout from '../components/AdminLayout';

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      
      // API 返回的数据结构：{ user, orders, stats }
      setUser(response.data.user);
      setOrders(response.data.orders || []);
      setStats(response.data.stats || null);
      setLoading(false);
    } catch (error) {
      console.error('获取用户详情失败:', error);
      alert('获取用户详情失败');
      navigate('/user-manage');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`确定要${newStatus === 'disabled' ? '禁用' : '启用'}该用户吗？`)) {
      return;
    }

    try {
      await axios.patch(`/api/users/${userId}/status`, { status: newStatus });
      fetchUserDetail();
      alert('操作成功');
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('操作失败');
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!confirm(`确定要将该用户设为${newRole === 'admin' ? '管理员' : '普通用户'}吗？`)) {
      return;
    }

    try {
      await axios.patch(`/api/users/${userId}/role`, { role: newRole });
      fetchUserDetail();
      alert('操作成功');
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-600">用户不存在</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/user-manage')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span>返回用户列表</span>
        </button>

        {/* 用户基本信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User size={24} />
            用户详情
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧：基本信息 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm text-gray-500">用户名</div>
                  <div className="font-medium">{user.username}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm text-gray-500">邮箱</div>
                  <div className="font-medium">{user.email}</div>
                </div>
              </div>

              {user.telegramId && (
                <div className="flex items-start gap-3">
                  <Activity className="text-gray-400 mt-1" size={20} />
                  <div>
                    <div className="text-sm text-gray-500">Telegram</div>
                    <div className="font-medium">
                      <div>ID: {user.telegramId}</div>
                      {user.telegramUsername && (
                        <div className="text-sm text-blue-600">@{user.telegramUsername}</div>
                      )}
                      {user.telegramFirstName && (
                        <div className="text-sm text-gray-600">
                          {user.telegramFirstName} {user.telegramLastName || ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm text-gray-500">注册时间</div>
                  <div className="font-medium">
                    {new Date(user.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm text-gray-500">最后登录</div>
                  <div className="font-medium">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
                      : '从未登录'}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：状态和权限 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="text-gray-400 mt-1" size={20} />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-2">角色</div>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="text-gray-400 mt-1" size={20} />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-2">状态</div>
                  <button
                    onClick={() =>
                      handleStatusChange(user.status === 'active' ? 'disabled' : 'active')
                    }
                    className={`w-full px-4 py-2 rounded-lg font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {user.status === 'active' ? '✅ 正常' : '❌ 禁用'}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm text-gray-500">注册来源</div>
                  <div className="font-medium">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        user.source === 'telegram'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.source === 'telegram' ? '📱 Telegram' : '🌐 网站'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-blue-500" size={24} />
              <div className="text-sm text-gray-500">总订单数</div>
            </div>
            <div className="text-xl font-bold">{stats?.totalOrders || 0}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-green-500" size={24} />
              <div className="text-sm text-gray-500">完成订单</div>
            </div>
            <div className="text-xl font-bold text-green-600">
              {stats?.completedOrders || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-purple-500" size={24} />
              <div className="text-sm text-gray-500">总交易额</div>
            </div>
            <div className="text-xl font-bold text-purple-600">
              ¥{(stats?.totalAmount || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* 订单列表 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">订单记录</h3>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无订单记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      订单号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      类型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      金额
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      创建时间
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.payType === 'USDT'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.payType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {order.amount} {order.payType}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {order.status === 'completed'
                            ? '已完成'
                            : order.status === 'pending'
                            ? '待支付'
                            : order.status === 'processing'
                            ? '处理中'
                            : '已取消'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
