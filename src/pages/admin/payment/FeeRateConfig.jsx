export const FeeRateConfig = ({ coinType, settings, setSettings, enabledField, rulesField }) => {
  const isEnabled = settings[enabledField] || false;
  let rules = [];
  try {
    const raw = settings[rulesField];
    const parsed = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
    rules = Array.isArray(parsed) ? parsed : [];
  } catch {
    rules = [];
  }

  const toggleEnabled = (checked) => {
    setSettings({ ...settings, [enabledField]: checked });
  };

  const addRule = () => {
    const newRules = [...rules];
    newRules.push({
      minAmount: newRules.length > 0 ? newRules[newRules.length - 1].maxAmount : 0,
      maxAmount: 999999,
      feeType: 'fixed',
      feeValue: coinType === 'USDT' ? 5 : 2,
      description: '新规则'
    });
    setSettings({ ...settings, [rulesField]: JSON.stringify(newRules) });
  };

  const updateRule = (index, field, value) => {
    const newRules = [...rules];
    newRules[index][field] = value;
    setSettings({ ...settings, [rulesField]: JSON.stringify(newRules) });
  };

  const deleteRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setSettings({ ...settings, [rulesField]: JSON.stringify(newRules) });
  };

  return (
    <>
      {/* 阶梯费率开关 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-blue-900 mb-1">{coinType} 阶梯费率</h3>
            <p className="text-xs text-blue-700">
              根据代付 {coinType} 数量自动应用不同的费率规则，支持固定费用和百分比费率混合使用
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => toggleEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {isEnabled ? (
        /* 阶梯费率配置 */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">费率规则配置</h3>
            <button
              onClick={addRule}
              className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-all"
            >
              + 添加规则
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                      规则 {index + 1}
                    </span>
                    <input
                      type="text"
                      value={rule.description || ''}
                      onChange={(e) => updateRule(index, 'description', e.target.value)}
                      className="text-sm bg-white border border-slate-200 rounded px-2 py-1 w-40"
                      placeholder="规则描述"
                    />
                  </div>
                  <button
                    onClick={() => deleteRule(index)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    删除
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">最小金额 ({coinType})</label>
                    <input
                      type="number"
                      value={rule.minAmount}
                      onChange={(e) => updateRule(index, 'minAmount', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">最大金额 ({coinType})</label>
                    <input
                      type="number"
                      value={rule.maxAmount}
                      onChange={(e) => updateRule(index, 'maxAmount', parseFloat(e.target.value) || 999999)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">费率类型</label>
                    <select
                      value={rule.feeType}
                      onChange={(e) => updateRule(index, 'feeType', e.target.value)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <option value="fixed">固定费用</option>
                      <option value="percentage">百分比费率</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      {rule.feeType === 'fixed' ? '费用金额 (CNY)' : '费率百分比 (%)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={rule.feeValue}
                      onChange={(e) => updateRule(index, 'feeValue', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {rule.minAmount} - {rule.maxAmount === 999999 ? '∞' : rule.maxAmount} {coinType}: 
                  {rule.feeType === 'fixed' 
                    ? ` 固定收取 ¥${rule.feeValue}` 
                    : ` 收取 ${rule.feeValue}% 手续费`
                  }
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-green-800 mb-2">💡 使用说明</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• 系统会根据用户代付的 {coinType} 数量自动匹配对应的费率规则</li>
              <li>• 固定费用：无论金额多少，收取固定的人民币费用</li>
              <li>• 百分比费率：按照订单金额的百分比收取费用</li>
              <li>• 规则按顺序匹配，建议从小到大设置金额区间，区间不要留空档</li>
              <li>• 最后一档最大金额填 999999 表示无上限，不会截断前面的档位</li>
            </ul>
          </div>
        </div>
      ) : (
        /* 传统费率配置提示 */
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-600">
            阶梯费率未启用，使用全局设置中的统一费率
          </p>
          <p className="text-xs text-slate-500 mt-2">
            当前 {coinType} 固定费用: ¥{coinType === 'USDT' ? settings.feeUSDT : settings.feeTRX}
          </p>
        </div>
      )}
    </>
  );
}
export default FeeRateConfig;
