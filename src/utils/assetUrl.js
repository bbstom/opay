/** 后台常填 opaylog.jpg，相对当前页会变成 /settings/opaylog.jpg。根路径静态文件要补成 /opaylog.jpg */
export function publicAssetUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:|data:|blob:|\/\/)/i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}
