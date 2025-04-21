import { HeatmapDatum } from "../components/features/home/heatmap/HeatmapChart";
import {
  BetManager__factory,
  Multicall,
  Multicall__factory,
} from "../typechain";
import CONFIGS from "./configs";
import { ethers, MaxUint256 } from "ethers";
import { addDays } from "date-fns";
import { GLOBAL_CONFIG } from "./configs";

function getTargetBins(binCount: number) {
  const targetBins = [];
  let bin = GLOBAL_CONFIG.targetBinStart;
  for (let i = 0; i < binCount; i++) {
    targetBins.push(bin);
    bin += GLOBAL_CONFIG.tickSpacing;
  }
  return targetBins;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

async function executeMulticall(
  multicall: Multicall,
  queries: string[],
  target: string,
  maxRetries = 3
): Promise<bigint[][]> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const results = await multicall.aggregate.staticCall(
        queries.map((query) => ({
          target,
          callData: query,
        }))
      );
      const bmItf = BetManager__factory.createInterface();

      // 각 결과는 이제 배열이므로 적절히 디코딩
      return results.returnData.map((data) => {
        // 컨트랙트에서 반환된 배열을 디코딩
        const decodedData: bigint[] = bmItf.decodeFunctionResult(
          "getBinQuantitiesInRange",
          data
        )[1];
        // 각 값을 숫자로 변환
        return Array.from(decodedData) as bigint[];
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // 재시도 전에 잠시 대기 (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        continue;
      }
    }
  }

  throw new Error(
    `Multicall failed after ${maxRetries} attempts: ${lastError}`
  );
}

async function getHeatmapData(
  chainId: number,
  markets: number,
  firstDate: Date,
  binCount: number
): Promise<HeatmapDatum[]> {
  const chainConfig = CONFIGS[chainId];
  const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
  const betManager = BetManager__factory.connect(
    chainConfig.RangeBetManager,
    provider
  );

  const closedMarketPromise = betManager.getLastClosedMarketId();
  const multicall = Multicall__factory.connect(chainConfig.multicall, provider);

  const querys: string[] = [];
  const bins = getTargetBins(binCount);

  // 각 마켓별로 전체 빈 범위를 한 번에 요청
  for (let marketId = 0; marketId < markets; marketId++) {
    querys.push(
      betManager.interface.encodeFunctionData("getBinQuantitiesInRange", [
        marketId,
        bins[0], // fromBinIndex
        bins[bins.length - 1], // toBinIndex
      ])
    );
  }

  const chunks = chunkArray(querys, chainConfig.chunkSize);
  const results: bigint[][] = [];

  // 병렬 처리를 위한 청크 그룹 생성
  const groups = chunkArray(chunks, chainConfig.parallelChunks);

  // 각 그룹 순차 실행
  for (const group of groups) {
    const groupResults = await Promise.all(
      group.map((chunk) =>
        executeMulticall(multicall, chunk, chainConfig.RangeBetManager)
      )
    );

    // 각 결과는 이제 배열의 배열 형태로 처리
    for (const result of groupResults.flat()) {
      results.push(result);
    }
  }

  // 결과를 market별로 재구성
  const marketResults: HeatmapDatum[] = [];

  let date = firstDate;
  let closedMarketId = await closedMarketPromise;
  if (closedMarketId === MaxUint256) {
    closedMarketId = -1n;
  }

  for (let i = 0; i < markets; i++) {
    marketResults.push({
      date: date,
      values: results[i],
      state:
        i <= Number(closedMarketId)
          ? "closed"
          : i === Number(closedMarketId) + 1
          ? "today"
          : "open",
    });
    date = addDays(date, 1);
  }

  return marketResults;
}

export default getHeatmapData;
