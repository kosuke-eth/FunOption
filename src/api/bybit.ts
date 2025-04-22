// Node.jsのcryptoモジュールをブラウザ環境でも使用できるようにする
import { createHmac } from 'node:crypto';

// Bybit API設定
const API_KEY = process.env.BYBIT_TESTNET_API_KEY || '';
const API_SECRET = process.env.BYBIT_TESTNET_PRIVATE_KEY || '';
const BASE_URL = 'https://api-testnet.bybit.com';

// リクエストに必要な署名を生成する関数
function getSignature(timestamp: string, queryString: string): string {
  return createHmac('sha256', API_SECRET)
    .update(timestamp + API_KEY + queryString)
    .digest('hex');
}

// 共通のヘッダーを生成する関数
function getHeaders(queryString: string = ''): HeadersInit {
  const timestamp = Date.now().toString();
  const signature = getSignature(timestamp, queryString);

  return {
    'X-BAPI-API-KEY': API_KEY,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-SIGN': signature,
    'Content-Type': 'application/json'
  };
}

// Bybit APIクライアント
export const bybitClient = {
  // マーケットデータを取得
  async getMarketData(symbol: string = 'BTCUSDT') {
    try {
      const endpoint = '/v5/market/tickers';
      const queryString = `category=spot&symbol=${symbol}`;
      const url = `${BASE_URL}${endpoint}?${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(queryString)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  },
  
  // K線データを取得
  async getKlineData(symbol: string = 'BTCUSDT', interval: string = '1d', limit: number = 200) {
    try {
      const endpoint = '/v5/market/kline';
      const queryString = `category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const url = `${BASE_URL}${endpoint}?${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(queryString)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching kline data:', error);
      throw error;
    }
  },
  
  // アカウント情報を取得
  async getAccountInfo() {
    try {
      const endpoint = '/v5/account/wallet-balance';
      const queryString = 'accountType=UNIFIED';
      const url = `${BASE_URL}${endpoint}?${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(queryString)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }
};
