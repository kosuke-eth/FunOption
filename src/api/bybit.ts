// Node.jsのcryptoモジュールをブラウザ環境でも使用できるようにする
import { createHmac } from 'node:crypto';

// Bybit API設定
const API_KEY = process.env.BYBIT_TESTNET_API_KEY || '';
const API_SECRET = process.env.BYBIT_TESTNET_PRIVATE_KEY || '';
const BASE_URL = 'https://api-testnet.bybit.com';

// ---- internal util helpers -------------------------------------------------
function sign(timestamp: string, payload: string): string {
  return createHmac('sha256', API_SECRET).update(timestamp + API_KEY + payload).digest('hex');
}

function buildHeaders(payload: string = ''): HeadersInit {
  const ts = Date.now().toString();
  return {
    'X-BAPI-API-KEY': API_KEY,
    'X-BAPI-TIMESTAMP': ts,
    'X-BAPI-SIGN': sign(ts, payload),
    'Content-Type': 'application/json',
  };
}

async function request<T>(endpoint: string, options: RequestInit & { qs?: string } = {}): Promise<T> {
  const { qs = '', method = 'GET', body } = options;
  const payloadForSig = method === 'GET' ? qs : body ?? '';
  const headers = buildHeaders(payloadForSig as string);
  const url = `${BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, { ...options, method, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// オプション注文用のパラメータ型
export interface OptionOrderParams {
  symbol: string;
  side: 'Buy' | 'Sell';
  qty: number;
  price?: number;
  orderType?: 'Market' | 'Limit';
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'PostOnly';
}

// Bybit API レスポンス型 (注文作成)
export interface CreateOrderResult {
  retCode: number;
  retMsg: string;
  result: {
    orderId: string;
    orderLinkId?: string;
  };
  retExtInfo: Record<string, any>; // Use Record<string, any> for unknown object structure
  time: number;
}

// Bybit APIクライアント
export const bybitClient = {
  // マーケットデータを取得
  async getMarketData(symbol: string = 'BTCUSDT') {
    const qs = `category=spot&symbol=${symbol}`;
    return request('/v5/market/tickers', { qs });
  },

  // K線データを取得
  async getKlineData(symbol: string = 'BTCUSDT', interval: string = '1d', limit: number = 200) {
    const qs = `category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
    return request('/v5/market/kline', { qs });
  },

  // アカウント情報を取得
  async getAccountInfo() {
    const qs = 'accountType=UNIFIED';
    return request('/v5/account/wallet-balance', { qs });
  },

  // オプション注文を発注
  async createOptionOrder(params: OptionOrderParams): Promise<CreateOrderResult> {
    try {
      const endpoint = '/v5/order/create';
      const body = {
        category: 'option',
        symbol: params.symbol,
        side: params.side,
        orderType: params.orderType ?? (params.price !== undefined ? 'Limit' : 'Market'),
        qty: params.qty.toString(),
        ...(params.price !== undefined ? { price: params.price.toString() } : {}),
        timeInForce: params.timeInForce ?? 'GTC',
      };
      const bodyString = JSON.stringify(body);
      return request<CreateOrderResult>(endpoint, { method: 'POST', body: bodyString });
    } catch (error) {
      console.error('Error creating option order:', error);
      throw error;
    }
  },
};
