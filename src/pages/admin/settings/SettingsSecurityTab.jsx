import TwoFactorSetup from '../../../components/TwoFactorSetup';

export default function SettingsSecurityTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800 mb-4">登录安全</h2>
      <TwoFactorSetup variant="admin" />
    </div>
  );
}
