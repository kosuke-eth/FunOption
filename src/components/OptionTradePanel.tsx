import React, { useState, useEffect } from 'react';
import { OptionData } from '../mockData/optionsMock';
import { ChartStyles } from './OptionsChart/colorUtils';
import './OptionTradePanel.css';
import type { OptionOrderParams, CreateOrderResult } from '../api/bybit';

interface OptionTradePanelProps {
  option: OptionData | null;
  visible: boolean;
  onClose: () => void;
}

const OptionTradePanel: React.FC<OptionTradePanelProps> = ({ option, visible, onClose }) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [price, setPrice] = useState<number>(option?.ask ?? option?.markPrice ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sideMultiplier = side === 'buy' ? 1 : -1;

  // update price when option changes
  useEffect(() => {
    setPrice(option?.ask ?? option?.markPrice ?? 0);
  }, [option]);

  // Bybit symbol generator e.g., BTC - 31MAY24 - 60000 - C
  const toBybitSymbol = (opt: OptionData): string => {
    const [yyyy, mm, dd] = opt.expiry.split('-');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[Number(mm) - 1];
    const yy = yyyy.slice(2);
    const typeCode = opt.type === 'call' ? 'C' : 'P';
    return `BTC-${dd}${month}${yy}-${opt.strike}-${typeCode}`;
  };

  const handleConfirm = async () => {
    if (!option) return;
    setIsSubmitting(true);
    const { bybitClient } = await import('../api/bybit');
    const params: OptionOrderParams = {
      symbol: toBybitSymbol(option),
      side: side === 'buy' ? 'Buy' : 'Sell',
      qty: lotSize,
      price,
      orderType: 'Limit', // Explicitly set Limit order
      timeInForce: 'GTC',  // Good Till Cancelled
    };
    try {
      const result: CreateOrderResult = await bybitClient.createOptionOrder(params);
      console.log('Order placed result:', result);
      if (result.retCode === 0 && result.result?.orderId) {
        alert(`Order placed successfully! Order ID: ${result.result.orderId}`);
        onClose();
      } else {
        // Handle Bybit API error response
        const errorMsg = result.retMsg || 'Unknown Bybit API error';
        console.error('Bybit API Error:', result);
        alert(`Order failed: ${errorMsg} (Code: ${result.retCode})`);
      }
    } catch (e: any) {
      console.error('Order failed:', e);
      const message = e.response?.data?.retMsg || e.message || JSON.stringify(e);
      alert(`Order failed: ${message}`);
    }
    setIsSubmitting(false);
  };

  if (!option) return null;

  return (
    <div className={`option-trade-panel ${visible ? 'visible' : ''}`} aria-hidden={!visible}>
      {/* Header */}
      <div className="panel-header">
        <h2>{side === 'buy' ? 'Buy' : 'Sell'} {option.type.toUpperCase()} {option.strike}</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      {/* Side Switch */}
      <div className="toggle-group">
        <button
          className={`buy-btn ${side === 'buy' ? 'active' : ''}`}
          style={{ background: ChartStyles.colors.call, opacity: side === 'buy' ? 1 : 0.7 }}
          onClick={() => setSide('buy')}
        >
          Buy
        </button>
        <button
          className={`sell-btn ${side === 'sell' ? 'active' : ''}`}
          style={{ background: ChartStyles.colors.put, opacity: side === 'sell' ? 1 : 0.7 }}
          onClick={() => setSide('sell')}
        >
          Sell
        </button>
      </div>

      {/* Price and Size */}
      <h3 className="section-header">Price / Size</h3>

      {/* Price Input with +/- 5 USDT */}
      <div className="input-group">
        <label>Price (USDT)</label>
        <input
          type="number"
          min={0}
          step={5}
          value={price.toFixed(2)}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <button onClick={() => setPrice((p) => Math.max(0, p - 5))}>-</button>
        <button onClick={() => setPrice((p) => p + 5)}>+</button>
      </div>

      {/* Lot Size with +/- 0.01 BTC */}
      <div className="input-group">
        <label>Size (BTC)</label>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={lotSize}
          onChange={(e) => setLotSize(Number(e.target.value))}
        />
        <button onClick={() => setLotSize((s) => Math.max(0.01, parseFloat((s - 0.01).toFixed(2))))}>-</button>
        <button onClick={() => setLotSize((s) => parseFloat((s + 0.01).toFixed(2)))}>+</button>
      </div>

      {/* Price Information */}
      <h3 className="section-header">Price Information</h3>
      <div className="price-info">
        <div><span>Mark Price</span><span>{option.markPrice.toFixed(2)}</span></div>
        <div><span>Bid</span><span>{option.bid?.toFixed(2) ?? '-'}</span></div>
        <div><span>Ask</span><span>{option.ask?.toFixed(2) ?? '-'}</span></div>
      </div>

      {/* Greeks */}
      <h3 className="section-header">Greeks</h3>
      <div className="greeks-info">
        <div><span>Gamma</span><span>{option.gamma ? (option.gamma * sideMultiplier).toFixed(4) : '-'}</span></div>
        <div><span>Theta</span><span>{option.theta ? (option.theta * sideMultiplier).toFixed(4) : '-'}</span></div>
      </div>

      {/* Confirm */}
      <button
        className="confirm-btn"
        style={{ background: side === 'buy' ? ChartStyles.colors.call : ChartStyles.colors.put }}
        disabled={isSubmitting}
        onClick={handleConfirm}
      >
        {isSubmitting ? 'Placing…' : 'Confirm'}
      </button>
    </div>
  );
};

export default OptionTradePanel;
