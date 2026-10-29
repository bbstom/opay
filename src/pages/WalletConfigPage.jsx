import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/client';
import AdminLayout from '../components/AdminLayout';
import WalletBasicTab from './admin/wallet/WalletBasicTab';
import WalletWalletsTab from './admin/wallet/WalletWalletsTab';
import WalletEnergyTab from './admin/wallet/WalletEnergyTab';

const WalletConfigPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'wallets';
  const currentSubTab = searchParams.get('subtab') || 'api';
  
  const [config, setConfig] = useState({
    tronWalletAddress: '',
    hasPrivateKey: false,
    tronApiNodes: [
      { name: 'TronGrid', url: 'https://api.trongrid.io', apiKey: '', enabled: false },
      { name: 'ZAN', url: '', apiKey: '', enabled: false }
    ],
    walletAutoTransferEnabled: true,
    walletMaxRetryCount: 3,
    walletMinTRXBalance: 50,
    walletMinUSDTBalance: 100,
    energyRentalEnabled: false,
    energyRentalMode: 'transfer',
    energyRentalAddress: '',
    energyRentalAmountFirst: 20,
    energyRentalAmountNormal: 10,
    energyRentalWaitTime: 30,
    catfeeApiUrl: 'https://api.catfee.io',
    catfeeApiKey: '',
    catfeeEnergyFirst: 131000,
    catfeeEnergyNormal: 65000,
    catfeePeriod: 1
  });

  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // 钱包管理相关状态
  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null); // 选中的钱包（用于详情页）
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

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await axios.get('/api/wallet/config');
      // 解析 tronApiNodes JSON 字符串
      if (data.tronApiNodes) {
        try {
          data.tronApiNodes = JSON.parse(data.tronApiNodes);
        } catch (e) {
          console.error('解析 tronApiNodes 失败:', e);
          data.tronApiNodes = [
            { name: 'TronGrid', url: 'https://api.trongrid.io', apiKey: '', enabled: false },
            { name: 'ZAN', url: '', apiKey: '', enabled: false }
          ];
        }
      }
      setConfig(data);
    } catch (error) {
      console.error('获取钱包配置失败:', error);
    }
  };

  const handleValidateKey = async () => {
    if (!privateKey) {
      alert('请输入私钥');
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const { data } = await axios.post('/api/wallet/validate-key', { privateKey });
      setValidationResult(data);
    } catch (error) {
      setValidationResult({
        valid: false,
        message: error.response?.data?.error || '验证失败'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    // 验证至少有一个节点启用
    const hasEnabledNode = config.tronApiNodes && config.tronApiNodes.some(node => node.enabled && node.url);
    if (!hasEnabledNode) {
      alert('请至少启用并配置一个 API 节点');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tronApiNodes: JSON.stringify(config.tronApiNodes),
        walletAutoTransferEnabled: config.walletAutoTransferEnabled,
        walletMaxRetryCount: config.walletMaxRetryCount,
        walletMinTRXBalance: config.walletMinTRXBalance,
        walletMinUSDTBalance: config.walletMinUSDTBalance,
        energyRentalEnabled: config.energyRentalEnabled,
        energyRentalMode: config.energyRentalMode,
        energyRentalAddress: config.energyRentalAddress,
        energyRentalAmountFirst: config.energyRentalAmountFirst,
        energyRentalAmountNormal: config.energyRentalAmountNormal,
        energyRentalWaitTime: config.energyRentalWaitTime,
        catfeeApiUrl: config.catfeeApiUrl,
        catfeeApiKey: config.catfeeApiKey,
        catfeeEnergyFirst: config.catfeeEnergyFirst,
        catfeeEnergyNormal: config.catfeeEnergyNormal,
        catfeePeriod: config.catfeePeriod
      };

      if (privateKey) {
        payload.tronPrivateKey = privateKey;
      }

      const { data } = await axios.put('/api/wallet/config', payload);
      
      alert('保存成功！' + (data.walletAddress ? `\n钱包地址: ${data.walletAddress}` : ''));
      
      setPrivateKey('');
      setValidationResult(null);
      
      await fetchConfig();
      
      if (payload.tronGridApiKey !== undefined || payload.tronPrivateKey) {
        if (confirm('配置已保存。是否立即测试连接？')) {
          await handleTest();
        }
      }
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const { data } = await axios.post('/api/wallet/test');
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setTesting(false);
    }
  };

  // 钱包管理函数
  const fetchWallets = async () => {
    setWalletsLoading(true);
    try {
      const { data } = await axios.get('/api/wallets');
      setWallets(data.wallets);
    } catch (error) {
      console.error('获取钱包列表失败:', error);
      alert('获取钱包列表失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setWalletsLoading(false);
    }
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
      await fetchWallets();
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
      await fetchWallets();
    } catch (error) {
      alert('删除失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleWallet = async (walletId, enabled) => {
    try {
      const endpoint = enabled ? 'disable' : 'enable';
      await axios.post(`/api/wallets/${walletId}/${endpoint}`);
      await fetchWallets();
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRefreshWallet = async (walletId) => {
    try {
      await axios.post(`/api/wallets/${walletId}/refresh`);
      await fetchWallets();
      alert('刷新成功');
    } catch (error) {
      alert('刷新失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRefreshAllWallets = async () => {
    setWalletsLoading(true);
    try {
      const { data } = await axios.post('/api/wallets/refresh-all');
      alert(data.message);
      await fetchWallets();
    } catch (error) {
      alert('刷新失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setWalletsLoading(false);
    }
  };

  // 在 useEffect 中添加钱包列表的加载
  useEffect(() => {
    if (currentTab === 'wallets') {
      fetchWallets();
    }
  }, [currentTab]);

  // 查看钱包详情
  const handleViewWallet = async (walletId) => {
    try {
      const { data } = await axios.get(`/api/wallets/${walletId}`);
      setSelectedWallet(data.wallet);
    } catch (error) {
      console.error('获取钱包详情失败:', error);
      alert('获取钱包详情失败: ' + (error.response?.data?.error || error.message));
    }
  };

  // 返回钱包列表
  const handleBackToList = () => {
    setSelectedWallet(null);
  };

  if (!user || user.role !== 'admin') return null;

  const Tab = ({
  'basic': WalletBasicTab,
  'wallets': WalletWalletsTab,
  'energy': WalletEnergyTab,
  }[currentTab] || WalletWalletsTab);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* 主标签导航 */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setSearchParams({ tab: 'wallets' })}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                currentTab === 'wallets'
                  ? 'bg-[#0095ff] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              钱包管理
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'basic', subtab: 'api' })}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                currentTab === 'basic'
                  ? 'bg-[#0095ff] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              基础配置
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'energy' })}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                currentTab === 'energy'
                  ? 'bg-[#0095ff] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              能量租赁
            </button>
          </div>
        </div>

                <Tab
          config={config}
          setConfig={setConfig}
          privateKey={privateKey}
          setPrivateKey={setPrivateKey}
          showPrivateKey={showPrivateKey}
          setShowPrivateKey={setShowPrivateKey}
          loading={loading}
          testing={testing}
          validating={validating}
          testResult={testResult}
          validationResult={validationResult}
          handleValidateKey={handleValidateKey}
          handleSave={handleSave}
          handleTest={handleTest}
          wallets={wallets}
          walletsLoading={walletsLoading}
          showAddWallet={showAddWallet}
          setShowAddWallet={setShowAddWallet}
          selectedWallet={selectedWallet}
          setSelectedWallet={setSelectedWallet}
          newWallet={newWallet}
          setNewWallet={setNewWallet}
          handleAddWallet={handleAddWallet}
          handleDeleteWallet={handleDeleteWallet}
          handleToggleWallet={handleToggleWallet}
          handleRefreshWallet={handleRefreshWallet}
          handleRefreshAllWallets={handleRefreshAllWallets}
          handleViewWallet={handleViewWallet}
          handleBackToList={handleBackToList}
          currentSubTab={currentSubTab}
          setSearchParams={setSearchParams}
        />
      </div>
    </AdminLayout>
  );
};

export default WalletConfigPage;
