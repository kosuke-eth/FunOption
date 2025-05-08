import React, { useState, useEffect } from 'react';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

interface OrderHistoryItem {
  symbol: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  price: number;
  orderType: string;
  orderId: string;
  timestamp: string;
}

const OrderHistoryPanel: React.FC = () => {
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const loadHistory = () => {
      const storedHistory = localStorage.getItem('orderHistory');
      if (storedHistory) {
        try {
          const parsedHistory = JSON.parse(storedHistory) as OrderHistoryItem[];
          setHistory(parsedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); // 新しい順にソート
        } catch (error) {
          console.error("Failed to parse order history:", error);
          setHistory([]);
          enqueueSnackbar('Failed to load order history.', { variant: 'error' });
        }
      }
    };

    loadHistory();

    // Listen for custom event to reload history when a new order is placed
    const handleStorageChange = () => {
        console.log('Order history updated event received or storage changed.');
        loadHistory();
    };
    window.addEventListener('storage', handleStorageChange); // For changes in other tabs/windows
    window.addEventListener('orderHistoryUpdated', handleStorageChange); // Custom event from OptionTradePanel

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderHistoryUpdated', handleStorageChange);
    };
  }, [enqueueSnackbar]);

  const handleClearHistory = () => {
    localStorage.removeItem('orderHistory');
    setHistory([]);
    enqueueSnackbar('Order history cleared.', { variant: 'info' });
    // Dispatch event to notify other components if necessary (though direct state update is fine here)
    window.dispatchEvent(new Event('orderHistoryUpdated')); 
  };

  return (
    <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
      <Typography variant="h6" gutterBottom>
        Order History
      </Typography>
      {history.length === 0 ? (
        <Typography variant="body2">No orders in history.</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Side</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Order ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell>{new Date(order.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{order.symbol}</TableCell>
                  <TableCell>{order.side}</TableCell>
                  <TableCell>{order.orderType}</TableCell>
                  <TableCell>{order.price.toFixed(2)}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.orderId.substring(0, 8)}...</TableCell> 
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Button 
        variant="contained" 
        color="warning" 
        onClick={handleClearHistory} 
        sx={{ marginTop: 2 }} 
        disabled={history.length === 0}
      >
        Clear History
      </Button>
    </Paper>
  );
};

export default OrderHistoryPanel;
