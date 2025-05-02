import React from 'react';
import { useOptionOrderHistory } from '../../../providers/OptionOrderHistoryProvider';

const OrderHistory: React.FC = () => {
  const { history, loading, error, refresh } = useOptionOrderHistory();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Option Order History</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">Symbol</th>
                <th className="px-4 py-2 border">Side</th>
                <th className="px-4 py-2 border">Qty</th>
                <th className="px-4 py-2 border">Price</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Created At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((order) => (
                <tr key={order.orderId} className="even:bg-gray-50">
                  <td className="px-4 py-2 border">{order.orderId}</td>
                  <td className="px-4 py-2 border">{order.symbol}</td>
                  <td className="px-4 py-2 border">{order.side}</td>
                  <td className="px-4 py-2 border">{order.qty}</td>
                  <td className="px-4 py-2 border">{order.price}</td>
                  <td className="px-4 py-2 border">{order.orderStatus}</td>
                  <td className="px-4 py-2 border">{new Date(Number(order.createTime)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={refresh} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Refresh</button>
    </div>
  );
};

export default OrderHistory;
