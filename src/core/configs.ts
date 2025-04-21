interface Configs {
  rpcUrl: string;
  USDC: string;
  RangeBetManager: string;
  multicall: string;
  chunkSize: number;
  parallelChunks: number;
  createdBlocknum: number;
  explorer: string;
}

export const POLYGON_MAINNET = 137;
export const ROOTSTOCK = 31;
export const CITREA = 5115;

export const GLOBAL_CONFIG = {
  chainId: POLYGON_MAINNET,
  startDate: new Date("2025-03-31"),
  dateCount: 31,
  startPrice: 75000,
  binCount: 40,
  tickSpacing: 60,
  targetBinStart: 0,
};
export const CHART_CONFIG = {
  height: 600,
};

const CONFIGS: Record<number, Configs> = {
  [ROOTSTOCK]: {
    rpcUrl: "https://rpc.testnet.rootstock.io/ftZ3SGjLVuC4p9Bl70AF0EdUBSz3Ca-T",
    USDC: "0x4f19f78Ab075f033004A5f42bCFdE294CbeE2AEF",
    RangeBetManager: "0x37714c231bd5D87f7655DEFe8116705CA280438d",
    multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    createdBlocknum: 6242906,
    chunkSize: 11,
    parallelChunks: 3,
    explorer: "https://explorer.testnet.rootstock.io/",
  },
  [CITREA]: {
    rpcUrl: "https://rpc.testnet.citrea.xyz",
    USDC: "0xb6b624Da7B46dc0027a2eA5E8321750179c7Dc96",
    RangeBetManager: "0xeA6f722a45D684a09F770ae6B528F4513890b254",
    multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    createdBlocknum: 8539452,
    chunkSize: 20,
    parallelChunks: 3,
    explorer: "https://explorer.testnet.citrea.xyz/",
  },
  [POLYGON_MAINNET]: {
    rpcUrl:
      "https://polygon-mainnet.g.allthatnode.com/full/evm/92c0459bd6394890a091bead6672bde8",
    USDC: "0x1Ba59a311Fb42D475dBC55C9bc780e3883E25A53", // Mock USDC
    RangeBetManager: "0x35c3C4FA2F14544dA688e41118edAc953cc48cDa",
    multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
    createdBlocknum: 69936222,
    chunkSize: 20,
    parallelChunks: 3,
    explorer: "https://polygonscan.com/",
  },
} as const;

export const binIndexToBin = (binIndex: number) => {
  return binIndex * GLOBAL_CONFIG.tickSpacing + GLOBAL_CONFIG.targetBinStart;
};
export const binToBinIndex = (bin: number) => {
  return (bin - GLOBAL_CONFIG.targetBinStart) / GLOBAL_CONFIG.tickSpacing;
};

export const getBinRange = (binIndex: number | null, priceBins: number[]) =>
  binIndex !== null ? [priceBins[binIndex], priceBins[binIndex + 1]] : null;

export const createPriceBins = (startPrice: number, length: number) => {
  return Array.from({ length: length + 1 }, (_, i) => startPrice + i * 500);
};

export default CONFIGS;
