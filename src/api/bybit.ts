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

async function request<T>(endpoint: string, options: RequestInit & { qs?: string } = {}): Promise<BybitApiResponse<T>> {
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

// 汎用的な Bybit API レスポンス型
export interface BybitApiResponse<T> {
  retCode: number;       // 0 は成功を示す
  retMsg: string;        // エラーメッセージまたは 'OK'
  result: T;             // 実際の結果データ
  retExtInfo: any;       // 追加情報 (通常は空)
  time: number;          // サーバータイムスタンプ
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

// Create Order
export interface CreateOrderResultData {
  orderId: string;
  orderLinkId?: string;
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
  list: OrderHistoryRecord[];
  nextPageCursor?: string;
}

// --- 追加: Option Ticker 情報の型定義 ---
export interface OptionTicker {
  symbol: string; // シンボル名 (例: BTC-30AUG24-100000-C)
  bid1Price: string; // 最良買気配値
  bid1Size: string;  // 最良買気配数量
  ask1Price: string; // 最良売気配値
  ask1Size: string;  // 最良売気配数量
  lastPrice: string; // 最終取引価格
  markPrice: string; // マーク価格
  indexPrice: string; // インデックス価格 (原資産価格)
  iv: string; // インプライド・ボラティリティ
  markIv: string; // マークプライスのインプライド・ボラティリティ
  delta: string;
  gamma: string;
  vega: string;
  theta: string;
  highPrice24h: string; // 24時間高値
  lowPrice24h: string; // 24時間安値
  turnover24h: string; // 24時間取引高 (Quote currency)
  volume24h: string; // 24時間出来高 (Base currency)
  openInterest: string; // 未決済建玉
  // 他にも useful な field があるかもしれない
}

export interface GetTickersResult {
  category: 'option';
  list: OptionTicker[];
}

// --- 追加: Option Instrument 情報の型定義 ---
export interface OptionInstrumentInfo {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  launchTime: string;
  deliveryTime: string; // 満期日時 (UTC)
  deliveryFeeRate: string;
  priceFilter: {
    minPrice: string;
    maxPrice: string;
    tickSize: string;
  };
  lotSizeFilter: {
    maxOrderQty: string;
    minOrderQty: string;
    qtyStep: string;
    postOnlyMaxOrderQty: string;
  };
  status: 'Trading' | 'PreLaunch' | 'Settling' | 'Delivering' | 'Closed';
  optionsType: 'Call' | 'Put';
  strikePrice: string;
}

export interface GetInstrumentsInfoResult {
  category: 'option';
  list: OptionInstrumentInfo[];
  nextPageCursor: string;
}

// Bybit APIクライアント
export const bybitClient = {
  // マーケットデータを取得
  async getMarketData(symbol: string = 'BTCUSDT'): Promise<BybitApiResponse<GetTickersResult>> {
    const qs = `category=spot&symbol=${symbol}`;
    return request<GetTickersResult>('/v5/market/tickers', { qs });
  },

  // K線データを取得
  async getKlineData(symbol: string = 'BTCUSDT', interval: string = '1d', limit: number = 200): Promise<BybitApiResponse<GetTickersResult>> {
    const qs = `category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
    return request<GetTickersResult>('/v5/market/kline', { qs });
  },

  // アカウント情報を取得
  async getAccountInfo(): Promise<BybitApiResponse<any>> {
    const qs = 'accountType=UNIFIED';
    return request<any>('/v5/account/wallet-balance', { qs });
  },

  // オプション注文を発注
  async createOptionOrder(params: OptionOrderParams): Promise<BybitApiResponse<CreateOrderResultData>> {
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
      return request<CreateOrderResultData>(endpoint, { method: 'POST', body: bodyString });
    } catch (error) {
      console.error('Error creating option order:', error);
      throw error;
    }
  },

  // オプション注文履歴を取得
  async getOptionOrderHistory(symbol?: string): Promise<BybitApiResponse<GetOrderHistoryResult>> {
    const qs = `category=option${symbol ? `&symbol=${symbol}` : ''}`;
    return request<GetOrderHistoryResult>('/v5/order/history', { qs });
  },

  // --- 追加: オプション商品情報取得関数 ---
  async getOptionInstruments(params: { baseCoin?: string; status?: 'Trading' | 'PreLaunch' | 'Settling' | 'Delivering' | 'Closed'; limit?: number; cursor?: string }): Promise<BybitApiResponse<GetInstrumentsInfoResult>> {
    const qsParams = new URLSearchParams({ category: 'option' });
    if (params.baseCoin) qsParams.append('baseCoin', params.baseCoin);
    if (params.status) qsParams.append('status', params.status);
    if (params.limit) qsParams.append('limit', params.limit.toString());
    if (params.cursor) qsParams.append('cursor', params.cursor);
    const qs = qsParams.toString();
    return request<GetInstrumentsInfoResult>('/v5/market/instruments-info', { qs });
  },

  // --- 追加: オプションティッカー取得関数 ---
  async getOptionTickers(params?: { symbol?: string; baseCoin?: string; expDate?: string }): Promise<BybitApiResponse<GetTickersResult>> {
    const qsParams = new URLSearchParams({ category: 'option' });
    if (params?.symbol) qsParams.append('symbol', params.symbol);
    if (params?.baseCoin) qsParams.append('baseCoin', params.baseCoin);
    if (params?.expDate) qsParams.append('expDate', params.expDate); // 例: '29MAR24'
    const qs = qsParams.toString();
    return request<GetTickersResult>('/v5/market/tickers', { qs });
  },

  // --- 追加: Bybit Ticker 情報取得関数 ---
  async getBybitTickers(baseCoin: string): Promise<BybitApiResponse<GetTickersResult>> {
    const qsParams = new URLSearchParams({ category: 'option', baseCoin });
    const qs = qsParams.toString();
    return request<GetTickersResult>('/v5/market/tickers', { qs });
  },
};

if (!API_KEY || !API_SECRET) {
  throw new Error('API_KEY or API_SECRET is not set');
}
