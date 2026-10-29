const SDK_SRC = 'https://telegram.org/js/telegram-web-app.js';

let loading = null;

export const loadTelegramWebApp = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Telegram?.WebApp) return Promise.resolve(window.Telegram.WebApp);
  if (loading) return loading;

  loading = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    const finish = () => resolve(window.Telegram?.WebApp || null);
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => resolve(null), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    script.onload = finish;
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });

  return loading;
};

export const bootTelegramWebApp = async () => {
  const tg = await loadTelegramWebApp();
  if (!tg) return null;
  try {
    tg.ready();
    tg.expand();
  } catch {
    // 浏览器预览没有 WebApp 宿主
  }
  return tg;
};
