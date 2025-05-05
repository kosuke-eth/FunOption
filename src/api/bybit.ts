// Node.jsのcryptoモジュールをブラウザ環境でも使用できるようにする
import { createHmac } from 'crypto';

// Bybit API設定
// Viteではprocess.envではなくimport.meta.envを使用
const API_KEY = import.meta.env.VITE_BYBIT_TESTNET_API_KEY || '';
const API_SECRET = import.meta.env.VITE_BYBIT_TESTNET_API_SECRET || '';
const BASE_URL = 'https://api-testnet.bybit.com';

// ---- internal util helpers -------------------------------------------------
// Include recvWindow in signature string as per Bybit V5 spec
function sign(timestamp: string, payload: string, recvWindow: string): string {
  // API_SECRETにはBybitから提供された文字列シークレットが設定されている必要がある
  const stringToSign = timestamp + API_KEY + recvWindow + payload;
  console.log('String to sign:', stringToSign); // 署名対象文字列をログ出力
  const signature = createHmac('sha256', API_SECRET)
    .update(stringToSign)
    .digest('hex');
  console.log('Generated Signature:', signature); // 生成された署名をログ出力
  return signature;
}

// Build headers including recvWindow for Bybit V5
function buildHeaders(payload: string = '', recvWindow: string = '5000'): HeadersInit {
  const ts = Date.now().toString();
  return {
    'X-BAPI-API-KEY': API_KEY,
    'X-BAPI-TIMESTAMP': ts,
    'X-BAPI-RECV-WINDOW': recvWindow,
    'X-BAPI-SIGN': sign(ts, payload, recvWindow),
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

// オプション注文履歴レコード型
export interface OrderHistoryRecord {
  orderId: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  price: string;
  qty: string;
  orderType: string;
  timeInForce: string;
  orderStatus: string;
  createTime: string;
}

// オプション注文履歴取得レスポンス型
export interface GetOrderHistoryResult {
  retCode: number;
  retMsg: string;
  result: {
    list: OrderHistoryRecord[];
    nextPageCursor?: string;
  };
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

  // オプション注文履歴を取得
  async getOptionOrderHistory(symbol?: string): Promise<GetOrderHistoryResult> {
    const qs = `category=option${symbol ? `&symbol=${symbol}` : ''}`;
    return request<GetOrderHistoryResult>('/v5/order/history', { qs });
  }
};

if (!API_KEY || !API_SECRET) {
  throw new Error('API_KEY or API_SECRET is not set');
}
