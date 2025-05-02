import React from 'react';
import { useOptionTrades } from 'providers/OptionTradesProvider';

const OrderHistory: React.FC = () => {
  const { trades } = useOptionTrades();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Option Order History</h2>
      {trades.length === 0 ? (
        <p>No trades yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Tx Hash</th>
                <th className="px-4 py-2 border">Symbol</th>
                <th className="px-4 py-2 border">Side</th>
                <th className="px-4 py-2 border">Qty</th>
                <th className="px-4 py-2 border">Price</th>
                <th className="px-4 py-2 border">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.time} className="even:bg-gray-50">
                  <td className="px-4 py-2 border">{trade.orderId}</td>
                  <td className="px-4 py-2 border">{trade.symbol}</td>
                  <td className="px-4 py-2 border">{trade.side}</td>
                  <td className="px-4 py-2 border">{trade.qty}</td>
                  <td className="px-4 py-2 border">{trade.price}</td>
                  <td className="px-4 py-2 border">{new Date(trade.time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
