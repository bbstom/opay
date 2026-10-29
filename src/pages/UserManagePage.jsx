import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/client';
import AdminLayout from '../components/AdminLayout';

export default function UserManagePage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      if (error.response?.status === 403) {
        alert('无权限访问');
        navigate('/admin');
      }
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/users/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!confirm(`确定要${newStatus === 'disabled' ? '禁用' : '启用'}该用户吗？`)) {
      return;
    }

    try {
      await axios.patch(`/api/users/${userId}/status`, { status: newStatus });
      fetchUsers();
      alert('操作成功');
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('操作失败');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`确定要将该用户设为${newRole === 'admin' ? '管理员' : '普通用户'}吗？`)) {
      return;
    }

    try {
      await axios.patch(`/api/users/${userId}/role`, { role: newRole });
      fetchUsers();
      alert('操作成功');
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('操作失败');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('确定要删除该用户吗？此操作不可恢复！')) {
      return;
    }

    try {
      await axios.delete(`/api/users/${userId}`);
      fetchUsers();
      alert('删除成功');
    } catch (error) {
      console.error('删除用户失败:', error);
      alert('删除失败');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.telegramId && user.telegramId.includes(searchTerm))
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">用户管理</h1>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">总用户数</div>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">活跃用户</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">TG 用户</div>
            <div className="text-2xl font-bold text-blue-600">{stats.telegramUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-gray-500 text-sm">今日新增</div>
            <div className="text-2xl font-bold text-purple-600">{stats.todayUsers}</div>
          </div>
        </div>
      )}

      {/* 搜索框 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          placeholder="搜索用户名、邮箱或 TG ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
        />
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单统计</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.telegramId && (
                      <div className="text-xs text-blue-600">TG: {user.telegramId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.source === 'telegram' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.source === 'telegram' ? '📱 Telegram' : '🌐 网站'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="user">用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusChange(user._id, user.status === 'active' ? 'disabled' : 'active')}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status === 'active' ? '✅ 正常' : '❌ 禁用'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>总计: {user.stats?.totalOrders || 0}</div>
                      <div className="text-green-600">完成: {user.stats?.completedOrders || 0}</div>
                      <div className="text-gray-500">¥{(user.stats?.totalAmount || 0).toFixed(2)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/admin/users/${user._id}`)}
                      className="text-cyan-600 hover:text-cyan-800 text-sm mr-3"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          没有找到匹配的用户
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
