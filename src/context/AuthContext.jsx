import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { AUTH_CLEARED_EVENT } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const onCleared = () => setUser(null);
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, onCleared);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    if (!data.requiresTwoFactor) setUser(data.user);
    return data;
  };

  const verifyTwoFactor = async (code) => {
    const { data } = await api.post('/api/auth/login/2fa', { code });
    setUser(data.user);
    return data;
  };

  const sendRegisterCode = async (email) => {
    const { data } = await api.post('/api/auth/send-register-code', { email });
    return data;
  };

  const sendResetCode = async (email) => {
    const { data } = await api.post('/api/auth/send-reset-code', { email });
    return data;
  };

  const resetPassword = async (email, code, password) => {
    const { data } = await api.post('/api/auth/reset-password', { email, code, password });
    return data;
  };

  const register = async (username, email, password, code, inviteCode) => {
    const { data } = await api.post('/api/auth/register', { username, email, password, code, inviteCode });
    if (data.user) setUser(data.user);
    return data;
  };

  const telegramLogin = async (telegramData) => {
    const { data } = await api.post('/api/auth/telegram-login', telegramData);
    if (!data.requiresTwoFactor) setUser(data.user);
    return data;
  };

  const telegramWebAppLogin = async (initData) => {
    const { data } = await api.post('/api/auth/telegram-webapp', { initData });
    if (data?.user && !data.requiresTwoFactor) setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // 本地也清掉登录态
    }
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => ({ ...prev, ...updatedUserData }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      verifyTwoFactor,
      register,
      sendRegisterCode,
      sendResetCode,
      resetPassword,
      telegramLogin,
      telegramWebAppLogin,
      logout,
      updateUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
