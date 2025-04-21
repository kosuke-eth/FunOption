import CONFIGS, {
  binToBinIndex,
  getBinRange,
  createPriceBins,
  GLOBAL_CONFIG,
} from "core/configs";
import { LivePrediction, PredictionLog } from "./interfaces";
import { formatEther, parseEther } from "ethers";
import { addDays } from "date-fns";
import { avgPriceFormatter, dollarFormatter } from "utils/formatter";
import { BetManager__factory, Multicall__factory } from "typechain";
import { JsonRpcProvider } from "ethers";
import { timeFormat } from "d3";

export const parsePredictionLogs = async (
  chainId: number,
  predictionLogs: PredictionLog[]
): Promise<LivePrediction[]> => {
  const config = CONFIGS[chainId];
  // assume that only one bin is target
  const priceBins = createPriceBins(
    GLOBAL_CONFIG.startPrice,
    GLOBAL_CONFIG.binCount
  );

  const preParsed = predictionLogs.map((predictionLog) => {
    const binIndex = binToBinIndex(predictionLog.binIndices[0]);
    const range = getBinRange(binIndex, priceBins)!;
    const tickets = predictionLog.amounts[0];
    const avg = (predictionLog.totalCost * parseEther("1")) / tickets;
    const date = addDays(GLOBAL_CONFIG.startDate, predictionLog.marketId);

    return {
      range: `${dollarFormatter(range[0], 0, 2)} to ${dollarFormatter(
        range[1],
        0,
        2
      )}`,
      avg: avgPriceFormatter(avg),
      bet: formatEther(predictionLog.totalCost),
      toWin: formatEther(tickets),
      date: timeFormat("%-d %b %Y")(date),
      result: null,
      shares: formatEther(tickets),
      bin: predictionLog.binIndices[0],
      marketId: predictionLog.marketId,
      totalCost: predictionLog.totalCost,
      txHash: predictionLog.txHash,
      blockNumber: predictionLog.blockNumber,
      value: "0",
    };
  });

  const itf = BetManager__factory.createInterface();
  const querys = predictionLogs.map((log) => ({
    target: config.RangeBetManager,
    callData: itf.encodeFunctionData("calculateBinSellCost", [
      log.marketId,
      log.binIndices[0],
      log.amounts[0],
    ]),
  }));

  const provider = new JsonRpcProvider(config.rpcUrl);
  const multicall = Multicall__factory.connect(config.multicall, provider);

  const results = await multicall.aggregate.staticCall(querys);

  const withCurrValue = results.returnData.map((data, index) => {
    const value = formatEther(data);
    return {
      ...preParsed[index],
      value,
    };
  });

  return withCurrValue;
};
