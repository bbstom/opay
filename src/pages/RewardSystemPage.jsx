import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Save } from 'lucide-react';
import axios from '../api/client';
import { invalidateSettingsCache } from '../context/SettingsContext';
import AdminLayout from '../components/AdminLayout';
import RewardRulesTab from './admin/reward/RewardRulesTab';
import RewardWithdrawTab from './admin/reward/RewardWithdrawTab';

const RewardSystemPage = () => {
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab') || 'rules';
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/settings')
      .then(({ data }) => setSettings(data))
      .catch((err) => console.error('获取设置失败:', err));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put('/api/settings', settings);
      invalidateSettingsCache();
      alert('设置保存成功！');
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return <div className="py-12 text-center text-sm text-slate-500">加载中...</div>;
  }

  return (
    <AdminLayout>
      {activeTab === 'rules' && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-600 transition-all disabled:opacity-50"
          >
            <Save size={20} /> {loading ? '保存中...' : '保存设置'}
          </button>
        </div>
      )}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        {activeTab === 'withdraws' ? (
          <RewardWithdrawTab />
        ) : (
          <RewardRulesTab settings={settings} setSettings={setSettings} />
        )}
      </div>
    </AdminLayout>
  );
};

export default RewardSystemPage;
