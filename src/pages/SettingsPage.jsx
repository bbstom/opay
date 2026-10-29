import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Save } from 'lucide-react';
import axios from '../api/client';
import { invalidateSettingsCache } from '../context/SettingsContext';
import AdminLayout from '../components/AdminLayout';
import SettingsSiteTab from './admin/settings/SettingsSiteTab';
import SettingsHeroTab from './admin/settings/SettingsHeroTab';
import SettingsSocialTab from './admin/settings/SettingsSocialTab';
import SettingsTelegramTab from './admin/settings/SettingsTelegramTab';
import SettingsRuntimeTab from './admin/settings/SettingsRuntimeTab';
import SettingsFooterTab from './admin/settings/SettingsFooterTab';
import SettingsFeeTab from './admin/settings/SettingsFeeTab';
import SettingsExchangeTab from './admin/settings/SettingsExchangeTab';
import SettingsSwapTab from './admin/settings/SettingsSwapTab';
import SettingsPaymentTab from './admin/settings/SettingsPaymentTab';
import SettingsEmailTab from './admin/settings/SettingsEmailTab';
import SettingsBlogTab from './admin/settings/SettingsBlogTab';
import SettingsAlertTab from './admin/settings/SettingsAlertTab';
import SettingsSecurityTab from './admin/settings/SettingsSecurityTab';

const SettingsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rateInfo, setRateInfo] = useState(null);
  const [refreshingRates, setRefreshingRates] = useState(false);

  // 从URL获取当前tab
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'site';

  useEffect(() => {
    fetchSettings();
    fetchRateInfo();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      setSettings(data);
    } catch (error) {
      console.error('获取设置失败:', error);
    }
  };

  const fetchRateInfo = async () => {
    try {
      const { data } = await axios.get('/api/settings/rate-info');
      setRateInfo(data);
    } catch (error) {
      console.error('获取汇率信息失败:', error);
    }
  };

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      const { data } = await axios.post('/api/settings/refresh-rates');
      alert('汇率更新成功！\nUSDT: ' + data.rates.USDT + ' CNY\nTRX: ' + data.rates.TRX + ' CNY');
      await fetchSettings();
      await fetchRateInfo();
    } catch (error) {
      alert('汇率更新失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setRefreshingRates(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put('/api/settings', settings);
      invalidateSettingsCache();
      
      // 如果是实时汇率模式，保存后自动刷新汇率以应用新的加成
      if (settings.exchangeRateMode === 'realtime') {
        try {
          await axios.post('/api/settings/refresh-rates');
          await fetchRateInfo();
        } catch (error) {
          console.error('刷新汇率失败:', error);
        }
      }
      
      alert('设置保存成功！');
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;
  if (!settings) return <div className="py-12 text-center text-sm text-slate-500">加载中...</div>;

  const Tab = ({
  'site': SettingsSiteTab,
  'hero': SettingsHeroTab,
  'social': SettingsSocialTab,
  'telegram': SettingsTelegramTab,
  'runtime': SettingsRuntimeTab,
  'footer': SettingsFooterTab,
  'fee': SettingsFeeTab,
  'exchange': SettingsExchangeTab,
  'swap': SettingsSwapTab,
  'payment': SettingsPaymentTab,
  'email': SettingsEmailTab,
  'blog': SettingsBlogTab,
  'alert': SettingsAlertTab,
  }[activeTab] || SettingsSiteTab);

  return (
    <AdminLayout>
      {activeTab !== 'security' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-600 transition-all disabled:opacity-50"
          >
            <Save size={20} /> {loading ? '保存中...' : '保存设置'}
          </button>
        </div>
      )}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        {activeTab === 'security' ? (
          <SettingsSecurityTab />
        ) : (
          <Tab
            settings={settings}
            setSettings={setSettings}
            rateInfo={rateInfo}
            handleRefreshRates={handleRefreshRates}
            refreshingRates={refreshingRates}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
