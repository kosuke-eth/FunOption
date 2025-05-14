import React, { useState, useEffect } from 'react';
import Header from 'components/layout/Header';
import TradeHistoryTable, { TradeHistoryItem } from 'components/TradeHistory/TradeHistoryTable';
import Body from 'components/layout/Body';

const HistoryPage: React.FC = () => {
  // Trade history data
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);

  // Fetch trade history
  useEffect(() => {
    const fetchTradeHistory = async () => {
      setHistoryLoading(true);
      
      try {
        // In a real app, fetch from API
        // For now, generate sample data
        setTimeout(() => {
          const sampleTrades: TradeHistoryItem[] = [
            {
              id: '0485b06123456789abcdef',
              market: 'BTC-11MAY25-59750-C-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Buy/Long',
              orderPrice: 41.05,
              filledAmount: '0.000.01 BTC',
              orderValue: '41.05 USDC',
              tradeType: 'Buy Order',
              orderTime: '05/11/2025, 12:15:57 PM',
              reduceOnly: false
            },
            {
              id: 'bb195c5b123456789abcdef',
              market: 'BTC-10MAY25-103500-P-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Sell/Short',
              orderPrice: 9.00,
              filledAmount: '0.000.01 BTC',
              orderValue: '9.00 USDC',
              tradeType: 'Sell Order',
              orderTime: '05/10/2025, 01:04:27 PM',
              reduceOnly: false
            },
            {
              id: '18c095bd123456789abcdef',
              market: 'BTC-12MAY25-99000-C-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Buy/Long',
              orderPrice: 51.30,
              filledAmount: '0.000.01 BTC',
              orderValue: '51.30 USDC',
              tradeType: 'Buy Order',
              orderTime: '05/10/2025, 12:57:22 PM',
              reduceOnly: false
            },
            {
              id: '164de5c5123456789abcdef',
              market: 'BTC-23MAY25-110000-P-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Buy/Long',
              orderPrice: 68.25,
              filledAmount: '0.000.01 BTC',
              orderValue: '68.25 USDC',
              tradeType: 'Buy Order',
              orderTime: '05/10/2025, 12:36:55 PM',
              reduceOnly: false
            },
            {
              id: '0e28fd63123456789abcdef',
              market: 'BTC-10MAY25-103750-P-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Buy/Long',
              orderPrice: 11.45,
              filledAmount: '0.000.01 BTC',
              orderValue: '11.45 USDC',
              tradeType: 'Buy Order',
              orderTime: '05/10/2025, 12:36:00 PM',
              reduceOnly: false
            },
            {
              id: 'e948a380123456789abcdef',
              market: 'BTC-11MAY25-108000-P-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Buy/Long',
              orderPrice: 58.00,
              filledAmount: '0.000.01 BTC',
              orderValue: '58.00 USDC',
              tradeType: 'Buy Order',
              orderTime: '05/09/2025, 09:17:58 PM',
              reduceOnly: false
            },
            {
              id: 'bbaa2dca123456789abcdef',
              market: 'BTC-11MAY25-110000-P-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Buy/Long',
              orderPrice: 74.80,
              filledAmount: '0.000.01 BTC',
              orderValue: '74.80 USDC',
              tradeType: 'Buy Order',
              orderTime: '05/09/2025, 09:16:33 PM',
              reduceOnly: false
            },
            {
              id: '7192a348123456789abcdef',
              market: 'BTC-9MAY25-98000-C-USDT',
              product: 'USDC Option',
              orderType: 'Limit',
              direction: 'Buy/Long',
              orderPrice: 20.85,
              filledAmount: '0.000.01 BTC',
              orderValue: '20.85 USDC',
              tradeType: 'Buy Order',
              orderTime: '05/08/2025, 03:42:52 PM',
              reduceOnly: false
            }
          ];
          
          setTrades(sampleTrades);
          setHistoryLoading(false);
        }, 800); // Simulate API delay
        
      } catch (error) {
        console.error('Failed to fetch trade history:', error);
        setHistoryLoading(false);
      }
    };
    
    fetchTradeHistory();
  }, []);

  const handleClearHistory = () => {
    // In a real app, call API to clear history
    setTrades([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-funoption-bg to-funoption-bg-dark">
      <Header />
      <Body>
        <div className="py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-funoption-text-DEFAULT">Your Trade History</h1>
            <p className="text-funoption-text-muted mt-2">View and manage your trading activity</p>
          </div>
          
          {/* Trade History Table */}
          <TradeHistoryTable 
            trades={trades}
            loading={historyLoading}
            onClearHistory={handleClearHistory}
          />
        </div>
      </Body>
    </div>
  );
};

export default HistoryPage;
