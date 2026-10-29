import axios from 'axios';

export const AUTH_CLEARED_EVENT = 'auth:cleared';

const AUTH_SKIP_401 = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/send-register-code',
  '/api/auth/send-reset-code',
  '/api/auth/reset-password',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/login/2fa',
  '/api/auth/telegram-login',
  '/api/auth/telegram-webapp',
  '/api/auth/check-qr-login',
  '/api/auth/qr-login-complete'
];

const api = axios.create({
  timeout: 15000,
  withCredentials: true
});

try {
  localStorage.removeItem('token');
} catch {
  // 忽略隐私模式下的存储限制
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const skip = AUTH_SKIP_401.some((path) => url.includes(path));

    if (status === 401 && !skip) {
      api.post('/api/auth/logout').catch(() => {});
      window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
      const path = window.location.pathname;
      if (path.startsWith('/tma')) {
        return Promise.reject(error);
      }
      if (!path.startsWith('/login')) {
        const next = encodeURIComponent(path + window.location.search);
        window.location.assign(`/login?redirect=${next}`);
      }
    }

    error.userMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      '请求失败';
    return Promise.reject(error);
  }
);

export const getApiError = (error, fallback = '请求失败') =>
  error?.userMessage || error?.response?.data?.error || error?.message || fallback;

/** 旧 fetch 写法接入同一条超时 / cookie / 401 链路 */
export const apiFetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  let data = options.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // 非 JSON 原样提交
    }
  }
  try {
    const res = await api({ url, method, data });
    return {
      ok: true,
      status: res.status,
      json: async () => res.data,
      data: res.data
    };
  } catch (error) {
    const payload = error.response?.data || { error: error.userMessage || error.message };
    return {
      ok: false,
      status: error.response?.status || 0,
      json: async () => payload,
      data: payload
    };
  }
};

export default api;
