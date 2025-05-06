import React, { useState, useEffect } from 'react';
import { OptionData } from '../mockData/optionsMock';
import { ChartStyles } from './OptionsChart/colorUtils';
import './OptionTradePanel.css';
import type { OptionOrderParams, CreateOrderResultData, OptionTicker } from '../api/bybit';
import { useSnackbar } from './SnackbarProvider';
import { useOptionTrades } from 'providers/OptionTradesProvider';
import { useWallet } from "@solana/wallet-adapter-react";
import { getUsdcDevBalance } from "../solana/checkBalance";

interface OptionTradePanelProps {
  option: OptionData | null;
  visible: boolean;
  onClose: () => void;
}

const OptionTradePanel: React.FC<OptionTradePanelProps> = ({ option, visible, onClose }) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [price, setPrice] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const sideMultiplier = side === 'buy' ? 1 : -1;

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

  useEffect(() => {
    if (!visible || !option) {
      return;
    }

    let isMounted = true;
    const fetchPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const { bybitClient } = await import('../api/bybit');
        const symbol = toBybitSymbol(option);
        console.log('[TradePanel] Fetching price for symbol:', symbol);
        const result = await bybitClient.getOptionTickers({ symbol });
        console.log('[TradePanel] API Result:', JSON.stringify(result, null, 2));

        if (isMounted && result.retCode === 0 && result.result?.list?.length > 0) {
          const ticker = result.result.list[0];
          console.log('[TradePanel] Ticker data:', JSON.stringify(ticker, null, 2));
          let fetchedPrice = 0;
          if (side === 'buy' && parseFloat(ticker.ask1Price) > 0) {
            fetchedPrice = parseFloat(ticker.ask1Price);
          } else if (side === 'sell' && parseFloat(ticker.bid1Price) > 0) {
            fetchedPrice = parseFloat(ticker.bid1Price);
          } else if (parseFloat(ticker.markPrice) > 0) {
            fetchedPrice = parseFloat(ticker.markPrice);
          } else {
            console.warn(`Could not determine valid price for ${symbol}, using 0.`);
          }
        } else if (isMounted) {
          console.error('[TradePanel] Failed to fetch ticker or ticker not found:', result.retMsg || `No ticker data for ${symbol}`);
          setPrice(0);
        }
      } catch (error) {
        if (isMounted) {
          console.error('[TradePanel] Error fetching ticker data:', error);
          setPrice(0);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPrice(false);
        }
      }
    };

    fetchPrice();

    return () => {
      isMounted = false;
    };
  }, [option, visible, side]);

  const handleConfirm = async () => {
    if (!option || isLoadingPrice) return;
    setIsSubmitting(true);
    const { bybitClient } = await import('../api/bybit');
    const orderLinkId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const params: OptionOrderParams = {
      symbol: toBybitSymbol(option),
      side: side === 'buy' ? 'Buy' : 'Sell',
      qty: lotSize,
      price,
      orderType: 'Limit',
      timeInForce: 'GTC',
      orderLinkId,
    };
    try {
      const result = await bybitClient.createOptionOrder(params);
      console.log('Order placed result:', result);
      if (result.retCode === 0 && result.result?.orderId) {
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

  if (!visible || !option) return null;

  return (
    <div className="option-trade-overlay" onClick={onClose}>
      <div className="option-trade-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>{side === 'buy' ? 'Buy' : 'Sell'} {option.type.toUpperCase()} {option.strike.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

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

        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Price / Size</h3>
          <div>
            <label htmlFor="price" className="block text-sm text-gray-300 mb-1">Price (USDC)</label>
            <div className={`flex items-center rounded-md h-9 space-x-1 ${isLoadingPrice ? 'opacity-50' : ''}`}>
              <div className="flex-auto min-w-0 bg-gray-700 h-full">
                <input
                  id="price"
                  type="number"
                  min={5}
                  step={5}
                  value={price}
                  onChange={(e) => {
                    // 入力値を5の倍数に丸める
                    const rawValue = Number(e.target.value);
                    const roundedValue = Math.round(rawValue / 5) * 5;
                    setPrice(roundedValue);
                  }}
                  disabled={isLoadingPrice}
                  className="w-full h-full bg-transparent px-1 py-1 text-right text-white focus:outline-none appearance-none [-moz-appearance:textfield] rounded-l-md"
                />
              </div>
              <button
                onClick={() => setPrice((p) => Math.max(0, p - 5))}
                disabled={isLoadingPrice}
                className="flex-shrink flex-grow-0 min-w-8 h-full px-1 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500"
                aria-label="Decrease price by 5"
              >-</button>
              <button
                onClick={() => setPrice((p) => p + 5)}
                disabled={isLoadingPrice}
                className="flex-shrink flex-grow-0 min-w-8 h-full bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500 rounded-r-md"
                aria-label="Increase price by 5"
              >+</button>
            </div>
            {isLoadingPrice && <div className="text-xs text-gray-400 mt-1">Loading price...</div>}
          </div>

          <div>
            <label htmlFor="lotSize" className="block text-sm text-gray-300 mb-1">Size (BTC)</label>
            <div className="flex items-center rounded-md h-9 space-x-1">
              <div className="flex-auto min-w-0 bg-gray-700 h-full">
                <input
                  id="lotSize"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={lotSize}
                  onChange={(e) => setLotSize(Number(e.target.value))}
                  className="w-full h-full bg-transparent px-1 py-1 text-right text-white focus:outline-none appearance-none [-moz-appearance:textfield] rounded-l-md"
                />
              </div>
              <button
                onClick={() => setLotSize((s) => Math.max(0.01, parseFloat((s - 0.01).toFixed(2))))}
                className="flex-shrink flex-grow-0 min-w-8 h-full bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500 rounded-r-md"
                aria-label="Decrease size by 0.01"
              >-</button>
              <button
                onClick={() => setLotSize((s) => parseFloat((s + 0.01).toFixed(2)))}
                className="flex-shrink flex-grow-0 min-w-8 h-full bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center border-l border-gray-500 rounded-r-md"
                aria-label="Increase size by 0.01"
              >+</button>
            </div>
          </div>
        </div>

        <h3 className="section-header mt-4">Price Information</h3>
        <div className="price-info mt-1 space-y-1">
          <div><span>Mark Price</span><span>{option.markPrice ? option.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span></div>
          <div><span>Bid</span><span>{option.bid ? option.bid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span></div>
          <div><span>Ask</span><span>{option.ask ? option.ask.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span></div>
        </div>

        <h3 className="section-header mt-4">Greeks</h3>
        <div className="greeks-info mt-1 space-y-1">
          <div><span>Gamma</span><span>{option.gamma ? (option.gamma * sideMultiplier).toFixed(4) : '-'}</span></div>
          <div><span>Theta</span><span>{option.theta ? (option.theta * sideMultiplier).toFixed(4) : '-'}</span></div>
        </div>

        <button
          className="confirm-btn mt-6"
          style={{ background: side === 'buy' ? ChartStyles.colors.call : ChartStyles.colors.put }}
          disabled={isSubmitting || isLoadingPrice || usdcBalance < price * lotSize}
          onClick={handleConfirm}
        >
          {isSubmitting ? 'Placing…' : (isLoadingPrice ? 'Loading Price...' : 'Confirm')}
        </button>
        <div className="mt-2 text-sm">USDC-DEV Balance: {usdcBalance.toFixed(6)}</div>
      </div>
    </div>
  );
};

export default OptionTradePanel;
