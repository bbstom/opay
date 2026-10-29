import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Save } from 'lucide-react';
import axios from '../api/client';
import { invalidateSettingsCache } from '../context/SettingsContext';
import AdminLayout from '../components/AdminLayout';
import PaymentWalletsTab from './admin/payment/PaymentWalletsTab';
import PaymentEnergyTab from './admin/payment/PaymentEnergyTab';
import PaymentRateTab from './admin/payment/PaymentRateTab';
import PaymentFeeTab from './admin/payment/PaymentFeeTab';
import PaymentApiNodesTab from './admin/payment/PaymentApiNodesTab';
import PaymentAutoTransferTab from './admin/payment/PaymentAutoTransferTab';

const PaymentSystemPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [settings, setSettings] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rateInfo, setRateInfo] = useState(null);
  const [refreshingRates, setRefreshingRates] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: '',
    privateKey: '',
    priority: 50,
    alerts: {
      minTrxBalance: 50,
      minUsdtBalance: 100,
      minEnergy: 50000,
      enabled: true
    }
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'wallets';

  useEffect(() => {
    fetchSettings();
    fetchWallets();
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

  const fetchWallets = async () => {
    try {
      const { data } = await axios.get('/api/wallets');
      setWallets(data.wallets || []);
    } catch (error) {
      console.error('获取钱包列表失败:', error);
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
      console.error('汇率更新失败:', error);
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

  const handleToggleWalletStatus = async (walletId, currentStatus) => {
    try {
      await axios.put(`/api/wallets/${walletId}/status`, {
        isActive: !currentStatus
      });
      fetchWallets();
    } catch (error) {
      alert('状态更新失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleViewWallet = async (walletId) => {
    try {
      const { data } = await axios.get(`/api/wallets/${walletId}`);
      setSelectedWallet(data.wallet);
    } catch (error) {
      alert('获取钱包详情失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBackToList = () => {
    setSelectedWallet(null);
    setShowAddWallet(false);
  };

  const handleAddWallet = async () => {
    if (!newWallet.name || !newWallet.privateKey) {
      alert('请填写钱包名称和私钥');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/wallets', newWallet);
      alert('钱包添加成功！');
      setShowAddWallet(false);
      setNewWallet({
        name: '',
        privateKey: '',
        priority: 50,
        alerts: {
          minTrxBalance: 50,
          minUsdtBalance: 100,
          minEnergy: 50000,
          enabled: true
        }
      });
      fetchWallets();
    } catch (error) {
      alert('添加失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (walletId, walletName) => {
    if (!confirm(`确定要删除钱包"${walletName}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await axios.delete(`/api/wallets/${walletId}`);
      alert('钱包删除成功');
      setSelectedWallet(null);
      fetchWallets();
    } catch (error) {
      alert('删除失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRefreshWallet = async (walletId) => {
    try {
      await axios.post(`/api/wallets/${walletId}/refresh`);
      alert('刷新成功');
      if (selectedWallet) {
        handleViewWallet(walletId);
      } else {
        fetchWallets();
      }
    } catch (error) {
      alert('刷新失败: ' + (error.response?.data?.error || error.message));
    }
  };

  if (!user || user.role !== 'admin') return null;
  if (!settings) return <div className="py-12 text-center text-sm text-slate-500">加载中...</div>;

  const Tab = ({
  'wallets': PaymentWalletsTab,
  'energy': PaymentEnergyTab,
  'rate': PaymentRateTab,
  'fee': PaymentFeeTab,
  'api-nodes': PaymentApiNodesTab,
  'auto-transfer': PaymentAutoTransferTab,
  }[activeTab] || PaymentWalletsTab);

  return (
    <AdminLayout>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-600 transition-all disabled:opacity-50"
        >
          <Save size={20} /> {loading ? '保存中...' : '保存设置'}
        </button>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <Tab
          settings={settings}
          setSettings={setSettings}
          rateInfo={rateInfo}
          handleRefreshRates={handleRefreshRates}
          refreshingRates={refreshingRates}
          wallets={wallets}
          selectedWallet={selectedWallet}
          showAddWallet={showAddWallet}
          newWallet={newWallet}
          showPrivateKey={showPrivateKey}
          loading={loading}
          handleToggleWalletStatus={handleToggleWalletStatus}
          handleViewWallet={handleViewWallet}
          handleBackToList={handleBackToList}
          handleAddWallet={handleAddWallet}
          handleDeleteWallet={handleDeleteWallet}
          handleRefreshWallet={handleRefreshWallet}
          setShowAddWallet={setShowAddWallet}
          setNewWallet={setNewWallet}
          setShowPrivateKey={setShowPrivateKey}
        />
      </div>
    </AdminLayout>
  );
};

export default PaymentSystemPage;
