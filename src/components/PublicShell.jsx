import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, User, LogOut, Send, Home, HelpCircle, Briefcase, ArrowDownUp,
  Menu, X, FileText, BookOpen, GraduationCap, Code, Building2, Shield, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettingsOptional } from '../context/SettingsContext';
import { USDTIcon, TRXIcon } from './Icons';

/** 前台顶栏 + 移动端菜单 */
const PublicNav = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const settingsCtx = useSettingsOptional();
  const footerSettings = settingsCtx?.settings;
  const siteName = settingsCtx?.siteName || '可可代付';
  const siteLogo = settingsCtx?.siteLogo || '';

  const [showPayMenu, setShowPayMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setShowPayMenu(false);
    setShowServicesMenu(false);
    setShowUserMenu(false);
  };

  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-5 right-5 z-[60] lg:hidden p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        {mobileMenuOpen ? <X size={24} className="text-slate-700" /> : <Menu size={24} className="text-slate-700" />}
      </button>

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto lg:hidden">
            <div className="p-4 pt-16 space-y-1">
              {user && (
                <div className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
                  <p className="text-sm font-bold text-slate-800">{user.username}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              )}
              <button onClick={() => go('/')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                <Home size={20} /><span>首页</span>
              </button>
              <button onClick={() => go('/pay')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                <USDTIcon className="w-5 h-5 flex-shrink-0" /><span>USDT 代付</span>
              </button>
              <button onClick={() => go('/pay-trx')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                <TRXIcon className="w-5 h-5 flex-shrink-0" /><span>TRX 代付</span>
              </button>
              <button onClick={() => go('/energy-rental')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                <Zap size={20} /><span>能量租赁</span>
              </button>
              <button onClick={() => go('/swap')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                <ArrowDownUp size={20} /><span>闪兑中心</span>
              </button>
              <button onClick={() => go('/services')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                <Menu size={20} /><span>服务总览</span>
              </button>
              <button onClick={() => go('/blog')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                <BookOpen size={20} /><span>博客</span>
              </button>
              {user && (
                <>
                  <div className="border-t border-slate-200 my-3" />
                  <button onClick={() => go('/user-center')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                    <User size={20} /><span>个人中心</span>
                  </button>
                  <button onClick={() => go('/my-orders')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                    <FileText size={20} /><span>我的订单</span>
                  </button>
                  {user.role === 'admin' && (
                    <button onClick={() => go('/admin')} className="w-full text-left px-4 py-3 rounded-lg hover:bg-cyan-50 font-bold text-cyan-600 flex items-center gap-3">
                      <span>管理后台</span>
                    </button>
                  )}
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 font-bold text-red-600 flex items-center gap-3">
                    <LogOut size={20} /><span>退出登录</span>
                  </button>
                </>
              )}
              {!user && (
                <button onClick={() => go('/login')} className="w-full px-4 py-3 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all mt-4">
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <nav className="fixed top-0 w-full z-50 h-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div onClick={() => navigate('/')} className="flex items-center gap-2 group cursor-pointer">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt={siteName}
                  className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-7 h-7 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-cyan-200 group-hover:rotate-12 transition-transform ${siteLogo ? 'hidden' : ''}`}>
                <Zap className="text-white" size={14} />
              </div>
              <span className="text-sm font-bold tracking-tight text-[#0a1224]">{siteName}</span>
            </div>
            <div className="hidden lg:flex items-center gap-5">
              <button onClick={() => navigate('/')} className="text-sm font-medium text-[#516985] hover:text-cyan-600 transition-colors flex items-center gap-1.5">
                <Home size={14} />首页
              </button>
              <div className="relative group" onMouseEnter={() => setShowPayMenu(true)} onMouseLeave={() => setShowPayMenu(false)}>
                <button className="text-sm font-medium text-[#516985] hover:text-cyan-600 transition-colors flex items-center gap-1.5">
                  <Briefcase size={14} />代付服务
                  <svg className={`w-3 h-3 transition-transform ${showPayMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-opacity duration-200 ${showPayMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                  <div className="w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                    <button onClick={() => go('/pay')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#516985] hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-2">
                      <USDTIcon className="w-4 h-4" />USDT 代付
                    </button>
                    <button onClick={() => go('/pay-trx')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#516985] hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-2">
                      <TRXIcon className="w-4 h-4" />TRX 代付
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/energy-rental')} className="text-sm font-medium text-[#516985] hover:text-cyan-600 transition-colors flex items-center gap-1.5">
                <Zap size={14} />能量租赁
              </button>
              <button onClick={() => navigate('/swap')} className="text-sm font-medium text-[#516985] hover:text-cyan-600 transition-colors flex items-center gap-1.5">
                <ArrowDownUp size={14} />闪兑中心
              </button>
              <div className="relative" onMouseEnter={() => setShowServicesMenu(true)} onMouseLeave={() => setShowServicesMenu(false)}>
                <button onClick={() => navigate('/services')} className="text-sm font-medium text-[#516985] hover:text-cyan-600 transition-colors flex items-center gap-1.5">
                  <Menu size={14} />服务总览
                  <svg className={`w-3 h-3 transition-transform ${showServicesMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`absolute top-full left-0 pt-2 transition-opacity duration-200 ${showServicesMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                  <div className="w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">服务介绍</div>
                    <button onClick={() => go('/services/usdt-payment')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><USDTIcon className="w-4 h-4" />USDT 代付详情</button>
                    <button onClick={() => go('/services/trx-payment')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><TRXIcon className="w-4 h-4" />TRX 代付详情</button>
                    <button onClick={() => go('/services/energy-rental')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><Zap size={16} />能量租赁详情</button>
                    <button onClick={() => go('/services/swap')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><ArrowDownUp size={16} />闪兑服务详情</button>
                    <div className="my-2 border-t border-slate-100" />
                    <div className="px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">使用指南</div>
                    <button onClick={() => go('/guides/beginner')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><GraduationCap size={16} />新手教程</button>
                    <button onClick={() => go('/guides/api')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><Code size={16} />API 文档</button>
                    <button onClick={() => go('/guides/faq')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><HelpCircle size={16} />常见问题</button>
                    <div className="my-2 border-t border-slate-100" />
                    <div className="px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">关于我们</div>
                    <button onClick={() => go('/about/company')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><Building2 size={16} />公司介绍</button>
                    <button onClick={() => go('/about/security')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><Shield size={16} />安全保障</button>
                    <button onClick={() => go('/about/contact')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2"><Phone size={16} />联系我们</button>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/blog')} className="text-sm font-medium text-[#516985] hover:text-cyan-600 transition-colors flex items-center gap-1.5">
                <BookOpen size={14} />博客
              </button>
              {footerSettings?.telegramCustomerService && (
                <a href={footerSettings.telegramCustomerService} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#516985] hover:text-cyan-600 transition-colors flex items-center gap-1.5">
                  <Send size={14} />TG客服
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                <div className="relative" onMouseEnter={() => setShowUserMenu(true)} onMouseLeave={() => setShowUserMenu(false)}>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{user.username}</span>
                  </button>
                  <div className={`absolute top-full right-0 pt-2 transition-opacity duration-200 ${showUserMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <div className="w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                      <button onClick={() => go('/user-center')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#516985] hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2">
                        <User size={14} />个人中心
                      </button>
                      <button onClick={() => go('/my-orders')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#516985] hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2">
                        <FileText size={14} />订单记录
                      </button>
                    </div>
                  </div>
                </div>
                {user.role === 'admin' && (
                  <button onClick={() => navigate('/admin')} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">管理后台</button>
                )}
                <button onClick={logout} className="text-slate-400 hover:text-slate-600"><LogOut size={18} /></button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="hidden lg:block bg-[#0095ff] hover:bg-[#007ad6] text-white px-3.5 h-9 rounded-lg text-sm font-semibold">
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export const RuntimeDisplay = () => {
  const settingsCtx = useSettingsOptional();
  const startFromSettings = settingsCtx?.settings?.systemStartTime;
  const [startTime, setStartTime] = useState(() =>
    startFromSettings ? new Date(startFromSettings) : new Date('2024-01-01T00:00:00')
  );
  const [runningTime, setRunningTime] = useState({ days: 0, hours: 0, min: 0, sec: 0 });

  useEffect(() => {
    if (startFromSettings) setStartTime(new Date(startFromSettings));
  }, [startFromSettings]);

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - startTime.getTime();
      setRunningTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        min: Math.floor((diff % 3600000) / 60000),
        sec: Math.floor((diff % 60000) / 1000)
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-extrabold text-green-600 tracking-wide">运行时间</p>
        <div className="flex gap-6">
          {[
            { val: String(runningTime.days).padStart(3, '0'), label: 'Days' },
            { val: String(runningTime.hours).padStart(2, '0'), label: 'Hours' },
            { val: String(runningTime.min).padStart(2, '0'), label: 'Min' },
            { val: String(runningTime.sec).padStart(2, '0'), label: 'Sec' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl font-black text-slate-900 tabular-nums">{item.val}</span>
              <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PublicFooter = () => {
  const settingsCtx = useSettingsOptional();
  const footerSettings = settingsCtx?.settings;
  if (!footerSettings) return null;

  let footerLinks = [];
  let bottomLinks = [];
  try { footerLinks = JSON.parse(footerSettings.footerLinks || '[]'); } catch (_) {}
  try { bottomLinks = JSON.parse(footerSettings.footerBottomLinks || '[]'); } catch (_) {}

  return (
    <footer className="bg-gradient-to-b from-white to-slate-50 py-5 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              {footerSettings.siteLogo ? (
                <img src={footerSettings.siteLogo} alt={footerSettings.footerCompanyName || '可可代付'} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-200">
                  <Zap className="text-white" size={16} />
                </div>
              )}
              <span className="text-lg font-black tracking-tighter text-slate-800">
                {footerSettings.footerCompanyName || '可可代付'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
              {footerSettings.footerDescription || '领先的自动化代付协议，为 TRON 生态提供安全、快速、便捷的 USDT 和 TRX 代付服务。'}
            </p>
          </div>
          {footerLinks.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{section.title}</h4>
              <ul className="space-y-2">
                {(section.links || []).map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a href={link.url} className="text-xs text-slate-600 hover:text-cyan-600 transition-colors font-medium">{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-400 font-medium">
            {footerSettings.footerCopyright || '© 2024 可可代付. All rights reserved.'}
          </p>
          <div className="flex gap-4">
            {bottomLinks.map((link, idx) => (
              <a key={idx} href={link.url} className="text-xs text-slate-400 hover:text-cyan-600 transition-colors font-medium">{link.name}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

/** 根据路径判断布局类型 */
export const useShellKind = () => {
  const { pathname } = useLocation();
  const adminPaths = [
    '/admin', '/finance', '/settings', '/wallet', '/faq-manage', '/admin-tickets',
    '/payment-system', '/swap-system', '/energy-system', '/energy-price', '/energy-balance',
    '/reward-system', '/user-manage',
    '/telegram-manage', '/seo-manage', '/admin/blog'
  ];
  const userPaths = ['/user-center', '/my-orders', '/my-tickets', '/my-rewards'];
  if (adminPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) return 'admin';
  if (userPaths.includes(pathname)) return 'user';
  return 'public';
};

export default PublicNav;
