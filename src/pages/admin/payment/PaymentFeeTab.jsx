import FeeRateConfig from './FeeRateConfig';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PaymentFeeTab({ settings, setSettings, rateInfo, handleRefreshRates, refreshingRates,
  wallets, selectedWallet, showAddWallet, newWallet, showPrivateKey, loading,
  handleToggleWalletStatus, handleViewWallet, handleBackToList, handleAddWallet,
  handleDeleteWallet, handleRefreshWallet, setShowAddWallet, setNewWallet, setShowPrivateKey }) {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(useLocation().search);
  return (

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 mb-4">代付服务费设置</h2>
            
            {/* 子标签切换 */}
            <div className="flex gap-2 border-b border-slate-200">
              <button
                onClick={() => navigate('?tab=fee&subTab=usdt')}
                className={`px-4 py-2 font-bold text-sm transition-all ${
                  (!searchParams.get('subTab') || searchParams.get('subTab') === 'usdt')
                    ? 'text-[#0095ff] border-b-2 border-[#0095ff]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                USDT 代付费率
              </button>
              <button
                onClick={() => navigate('?tab=fee&subTab=trx')}
                className={`px-4 py-2 font-bold text-sm transition-all ${
                  searchParams.get('subTab') === 'trx'
                    ? 'text-[#0095ff] border-b-2 border-[#0095ff]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                TRX 代付费率
              </button>
            </div>

            {/* USDT 费率配置 */}
            {(!searchParams.get('subTab') || searchParams.get('subTab') === 'usdt') && (
              <FeeRateConfig
                coinType="USDT"
                settings={settings}
                setSettings={setSettings}
                enabledField="tieredFeeEnabledUSDT"
                rulesField="tieredFeeRulesUSDT"
              />
            )}

            {/* TRX 费率配置 */}
            {searchParams.get('subTab') === 'trx' && (
              <FeeRateConfig
                coinType="TRX"
                settings={settings}
                setSettings={setSettings}
                enabledField="tieredFeeEnabledTRX"
                rulesField="tieredFeeRulesTRX"
              />
            )}
          </div>
        
  );
}
