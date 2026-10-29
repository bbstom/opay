import React from 'react';
import PayPage from './PayPage';

/** TRX 代付：复用统一代付页，仅币种配置不同 */
const PayPageTRX = () => <PayPage forcedPayType="TRX" />;

export default PayPageTRX;
