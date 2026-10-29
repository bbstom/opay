import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Loading = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm font-bold">
    加载中...
  </div>
);

/** 登录后才能进入；role=admin 时仅管理员 */
export const RequireAuth = ({ role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

/** 已登录则离开登录页 */
export const GuestOnly = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/user-center" replace />;
  return <Outlet />;
};
