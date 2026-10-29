import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api/client';

const SettingsContext = createContext(null);

const CACHE_TTL_MS = 60_000;
let memoryCache = { data: null, fetchedAt: 0 };

export const invalidateSettingsCache = () => {
  memoryCache = { data: null, fetchedAt: 0 };
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings 必须在 SettingsProvider 内使用');
  }
  return ctx;
};

/** 可选：不在 Provider 内时返回空实现，避免个别组件炸 */
export const useSettingsOptional = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(memoryCache.data);
  const [loading, setLoading] = useState(!memoryCache.data);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async (force = false) => {
    const now = Date.now();
    if (
      !force &&
      memoryCache.data &&
      now - memoryCache.fetchedAt < CACHE_TTL_MS
    ) {
      setSettings(memoryCache.data);
      setLoading(false);
      return memoryCache.data;
    }

    try {
      setLoading(true);
      const { data } = await api.get('/api/settings/public');
      memoryCache = { data, fetchedAt: Date.now() };
      setSettings(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('获取公开设置失败:', err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Favicon 同步
  useEffect(() => {
    if (!settings?.siteFavicon) return;
    document.querySelectorAll('link[rel*="icon"]').forEach((el) => el.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = settings.siteFavicon;
    document.head.appendChild(link);
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = settings.siteFavicon;
    document.head.appendChild(apple);
  }, [settings?.siteFavicon]);

  // 文档标题
  useEffect(() => {
    if (!settings) return;
    if (settings.seoTitle) {
      document.title = settings.seoTitle;
    } else if (settings.siteName) {
      document.title = `${settings.siteName} - USDT/TRX 代付平台`;
    }
  }, [settings?.seoTitle, settings?.siteName]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refresh: () => fetchSettings(true),
      siteName: settings?.siteName || '可可代付',
      siteLogo: settings?.siteLogo || ''
    }),
    [settings, loading, error, fetchSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

export default SettingsContext;
