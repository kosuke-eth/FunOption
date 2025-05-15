import React from 'react';

export interface TradeHistoryItem {
  id: string;
  market: string;
  product: string;
  orderType: string;
  direction: 'Buy/Long' | 'Sell/Short';
  orderPrice: number;
  filledAmount: string;
  orderValue: string;
  tradeType: string;
  orderTime: string;
  reduceOnly: boolean;
}

interface TradeHistoryTableProps {
  trades: TradeHistoryItem[];
  loading?: boolean;
  onClearHistory?: () => void;
}

const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  trades,
  loading = false,
  onClearHistory,
}) => {
  return (
    <div className="w-full animate-fadeIn bg-funoption-card-DEFAULT rounded-2xl overflow-hidden shadow-xl">
      {/* Table header with clear button */}
      <div className="flex justify-between items-center p-4 border-b border-funoption-border">
        <h2 className="text-xl font-bold text-funoption-text-DEFAULT">Trade History</h2>
        <button
          onClick={onClearHistory}
          className="px-4 py-2 bg-gradient-to-r from-funoption-primary-from to-funoption-primary-to hover:opacity-90 text-funoption-text-DEFAULT rounded-xl transition-colors text-sm"
        >
          Clear History
        </button>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-funoption-border">
          <thead className="bg-funoption-card-hover">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Market</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Order Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Direction</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Order Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Filled/Total Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Order Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Trade Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Order Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-funoption-text-muted uppercase tracking-wider">Reduce-Only</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-funoption-border bg-transparent">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-funoption-text-muted">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-funoption-primary-from" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading trade history...
                  </div>
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-funoption-text-muted">No trade history available.</td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-funoption-card-hover transition-colors">
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.market}</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.product}</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.orderType}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${trade.direction === 'Buy/Long' ? 'text-funoption-success' : 'text-funoption-danger'
                    }`}>
                    {trade.direction}
                  </td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.orderPrice}</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.filledAmount}</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.orderValue}</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.tradeType}</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.orderTime}</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-faint">{trade.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-funoption-text-DEFAULT">{trade.reduceOnly ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeHistoryTable;
