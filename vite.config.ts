import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { loadEnv } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込む
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      nodePolyfills({
        // Node.jsのcryptoモジュールをブラウザで使用できるようにする
        include: ['crypto', 'stream']
      }),
    ],
    // 環境変数をクライアント側で使用できるようにする
    define: {
      'process.env.BYBIT_TESTNET_API_KEY': JSON.stringify(env.BYBIT_TESTNET_API_KEY),
      'process.env.BYBIT_TESTNET_PRIVATE_KEY': JSON.stringify(env.BYBIT_TESTNET_PRIVATE_KEY),
    }
  }
})
