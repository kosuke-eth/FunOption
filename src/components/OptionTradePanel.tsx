import React, { useState, useEffect } from 'react';
import { OptionData } from '../mockData/optionsMock';
import { ChartStyles } from './OptionsChart/colorUtils';
import './OptionTradePanel.css';
import type { OptionOrderParams, CreateOrderResult } from '../api/bybit';
import { useSnackbar } from './SnackbarProvider';
import { useOptionTrades } from 'providers/OptionTradesProvider';
import { useWallet } from "@solana/wallet-adapter-react";
import { getUsdcDevBalance } from "solana/checkBalance";

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

  const { showSnackbar } = useSnackbar();
  const { addTrade } = useOptionTrades();
  const { publicKey } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  useEffect(() => {
    if (publicKey && visible) {
      getUsdcDevBalance(publicKey).then(setUsdcBalance);
    }
  }, [publicKey, visible]);

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
        // 保存用のトレード情報を context/localStorage に登録
        addTrade({
          orderId: result.result.orderId,
          symbol: params.symbol,
          side: params.side,
          qty: params.qty,
          price,
          time: Date.now(),
        });
        showSnackbar(`Order successful: ${result.result.orderId}`, 'success');
        onClose();
      } else {
        const errorMsg = result.retMsg || 'Unknown API error';
        console.error('Bybit API Error:', result);
        showSnackbar(`Order failed: ${errorMsg}`, 'error');
      }
    } catch (e: any) {
      console.error('Order failed:', e);
      const message = e.response?.data?.retMsg || e.message || JSON.stringify(e);
      showSnackbar(`Order failed: ${message}`, 'error');
    }
    setIsSubmitting(false);
  };

  // モーダル表示でなければ描画しない
  if (!visible || !option) return null;

  return (
    <div className="option-trade-overlay" onClick={onClose}>
      {/* モーダル本体。クリックをバブリングさせない */}
      <div className="option-trade-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <h2>{side === 'buy' ? 'Buy' : 'Sell'} {option.type.toUpperCase()} {option.strike.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
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

        {/* Price and Size Section - Simplified Layout */}
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Price / Size</h3>
          {/* Price Input - Stacked */}
          <div>
            <label htmlFor="price" className="block text-sm text-gray-300 mb-1">Price (USDT)</label>
            {/* Input group container with explicit height */}
            <div className="flex items-center rounded-md h-9 space-x-1">
              {/* Input wrapper fills height */}
              <div className="flex-auto min-w-0 bg-gray-700 h-full">
                <input
                  id="price"
                  type="number"
                  min={0}
                  step={5} // Consider adjusting step based on market conditions
                  value={price.toFixed(2)}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  // Input fills wrapper height
                  className="w-full h-full bg-transparent px-1 py-1 text-right text-white focus:outline-none appearance-none [-moz-appearance:textfield] rounded-l-md"
                />
              </div>
              {/* Button fills height */}
              <button
                onClick={() => setPrice((p) => Math.max(0, p - 5))}
                className="flex-shrink flex-grow-0 min-w-8 h-full px-1 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500"
                aria-label="Decrease price by 5"
              >-</button>
              {/* Button fills height */}
              <button
                onClick={() => setPrice((p) => p + 5)}
                className="flex-shrink flex-grow-0 min-w-8 h-full bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500 rounded-r-md"
                aria-label="Increase price by 5"
              >+</button>
            </div>
          </div>

          {/* Lot Size Input - Stacked */}
          <div>
            <label htmlFor="lotSize" className="block text-sm text-gray-300 mb-1">Size (BTC)</label>
            {/* Input group container with explicit height */}
            <div className="flex items-center rounded-md h-9 space-x-1">
              {/* Input wrapper fills height */}
              <div className="flex-auto min-w-0 bg-gray-700 h-full">
                <input
                  id="lotSize"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={lotSize}
                  onChange={(e) => setLotSize(Number(e.target.value))}
                  // Input fills wrapper height
                  className="w-full h-full bg-transparent px-1 py-1 text-right text-white focus:outline-none appearance-none [-moz-appearance:textfield] rounded-l-md"
                />
              </div>
              {/* Button fills height */}
              <button
                onClick={() => setLotSize((s) => Math.max(0.01, parseFloat((s - 0.01).toFixed(2))))}
                className="flex-shrink flex-grow-0 min-w-8 h-full bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500 rounded-r-md"
                aria-label="Decrease size by 0.01"
              >-</button>
              {/* Button fills height */}
              <button
                onClick={() => setLotSize((s) => parseFloat((s + 0.01).toFixed(2)))}
                className="flex-shrink flex-grow-0 min-w-8 h-full bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500 rounded-r-md"
                aria-label="Increase size by 0.01"
              >+</button>
            </div>
          </div>
        </div>

        {/* Price Information Section */}
        <h3 className="section-header mt-4">Price Information</h3>
        <div className="price-info mt-1 space-y-1">
          {/* Format numbers with commas */}
          <div><span>Mark Price</span><span>{option.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div><span>Bid</span><span>{option.bid ? option.bid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span></div>
          <div><span>Ask</span><span>{option.ask ? option.ask.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span></div>
        </div>

        {/* Greeks */}
        <h3 className="section-header mt-4">Greeks</h3>
        <div className="greeks-info mt-1 space-y-1">
          <div><span>Gamma</span><span>{option.gamma ? (option.gamma * sideMultiplier).toFixed(4) : '-'}</span></div>
          <div><span>Theta</span><span>{option.theta ? (option.theta * sideMultiplier).toFixed(4) : '-'}</span></div>
        </div>

        {/* Confirm */}
        <button
          className="confirm-btn mt-6"
          style={{ background: side === 'buy' ? ChartStyles.colors.call : ChartStyles.colors.put }}
          disabled={isSubmitting || usdcBalance < price * lotSize}
          onClick={handleConfirm}
        >
          {isSubmitting ? 'Placing…' : 'Confirm'}
        </button>
        <div className="mt-2 text-sm">USDC-DEV Balance: {usdcBalance.toFixed(6)}</div>
      </div>
    </div>
  );
};

export default OptionTradePanel;
