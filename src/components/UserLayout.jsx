import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/client';
import {
  User,
  FileText,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Home,
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/user-center', icon: User, label: '个人中心' },
  { path: '/my-rewards', icon: Gift, label: '邀请奖励' },
  { path: '/my-orders', icon: FileText, label: '我的订单' },
  { path: '/my-tickets', icon: MessageSquare, label: '我的工单' }
];

const UserLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const load = async () => {
      try {
        const { data } = await axios.get('/api/tickets/my/unread-count');
        setUnreadTicketsCount(data.count || 0);
      } catch (error) {
        console.error('获取未读工单数量失败:', error);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const go = (path) => {
    navigate(path);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const current = navItems.find((item) => location.pathname === item.path);

  return (
    <div className="min-h-screen bg-[#e8f4fc]">
      <div className="max-w-7xl mx-auto min-h-screen flex bg-[#f5fbff] border-x border-slate-200/80">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen w-56 bg-white border-r border-slate-200 z-50 flex flex-col flex-shrink-0 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
            <span className="text-base font-black text-slate-800">个人中心</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-slate-100 rounded-lg md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {user && (
          <div className="px-3 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#0095ff] flex items-center justify-center font-black text-sm">
                {(user.username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{user.username}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active ? 'bg-[#0095ff] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="font-bold">{item.label}</span>
                {item.path === '/my-tickets' && unreadTicketsCount > 0 && (
                  <span className={`ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    active ? 'bg-white text-[#0095ff]' : 'bg-red-500 text-white'
                  }`}>
                    {unreadTicketsCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => go('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <Home size={18} />
            <span className="font-bold">返回首页</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            <span className="font-bold">退出登录</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="sticky top-0 h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:px-5 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg md:hidden"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-800 leading-tight">
              {current?.label || '个人中心'}
            </h1>
            <p className="text-xs text-slate-500 hidden md:block">欢迎回来，{user?.username}</p>
          </div>
        </header>
        <div className="p-3 md:p-4 pb-6">{children}</div>
      </main>
      </div>
    </div>
  );
};

export default UserLayout;
