/**
 * 阶梯费率（与 server/utils/tieredFee.js 同一套规则）
 *
 * 规则：[{ minAmount, maxAmount, feeType: 'fixed'|'percentage', feeValue, description }]
 * maxAmount >= 999999 视为该档无上限，同时整单不设金额封顶。
 */

const UNLIMITED = 999999;

export function parseFeeRules(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function capOf(rule) {
  const max = Number(rule?.maxAmount);
  if (!Number.isFinite(max) || max >= UNLIMITED) return Infinity;
  return max;
}

export function findMatchedFeeRule(amount, rules) {
  const amt = Number(amount) || 0;
  return (
    rules.find((rule) => {
      const min = Number(rule.minAmount) || 0;
      return amt >= min && amt <= capOf(rule);
    }) || null
  );
}

export function getFeeAmountCap(rules) {
  if (!rules?.length) return null;
  if (rules.some((rule) => capOf(rule) === Infinity)) return null;
  return Math.max(...rules.map((rule) => capOf(rule)));
}

function getExchangeRate(payType, settings) {
  return payType === 'USDT' ? settings.exchangeRateUSDT : settings.exchangeRateTRX;
}

export function calculateDefaultFee(amount, payType, settings) {
  const amt = Number(amount) || 0;
  if (settings.feeType === 'fixed') {
    return payType === 'USDT' ? settings.feeUSDT : settings.feeTRX;
  }
  const cnyAmount = amt * (getExchangeRate(payType, settings) || 0);
  return parseFloat((cnyAmount * ((settings.feePercentage || 0) / 100)).toFixed(2));
}

export function quoteServiceFee(amount, payType, settings) {
  const amt = Number(amount) || 0;
  const rate = settings ? getExchangeRate(payType, settings) || 0 : 0;
  const cnyAmount = amt * rate;

  const withTotals = (partial) => ({
    rate,
    cnyAmount,
    totalCNY: parseFloat((cnyAmount + (partial.serviceFee || 0)).toFixed(2)),
    cap: partial.cap ?? null,
    error: partial.error || null,
    matchedRule: partial.matchedRule || null,
    feeLabel: partial.feeLabel || '',
    serviceFee: partial.serviceFee || 0
  });

  if (!settings) {
    return withTotals({ serviceFee: 0 });
  }

  const enabled =
    payType === 'USDT' ? settings.tieredFeeEnabledUSDT : settings.tieredFeeEnabledTRX;
  const raw = payType === 'USDT' ? settings.tieredFeeRulesUSDT : settings.tieredFeeRulesTRX;

  const fallbackFee = () => {
    const serviceFee = calculateDefaultFee(amount, payType, settings);
    const feeLabel =
      settings.feeType === 'fixed' ? `[固定${serviceFee}]` : `[${settings.feePercentage}%]`;
    return withTotals({ serviceFee, feeLabel });
  };

  if (!enabled) return fallbackFee();

  const rules = parseFeeRules(raw);
  const cap = getFeeAmountCap(rules);
  if (cap != null && amt > cap) {
    return withTotals({
      cap,
      error: `代付金额超出限额！最大支持 ${cap} ${payType}`
    });
  }

  const matchedRule = findMatchedFeeRule(amt, rules);
  if (!matchedRule) return { ...fallbackFee(), cap };

  if (matchedRule.feeType === 'fixed') {
    const serviceFee = Number(matchedRule.feeValue) || 0;
    return withTotals({
      cap,
      matchedRule,
      serviceFee,
      feeLabel: `[固定${serviceFee}]`
    });
  }

  const serviceFee = parseFloat(
    (cnyAmount * ((Number(matchedRule.feeValue) || 0) / 100)).toFixed(2)
  );
  return withTotals({
    cap,
    matchedRule,
    serviceFee,
    feeLabel: `[${matchedRule.feeValue}%]`
  });
}
