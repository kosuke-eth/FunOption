import CONFIGS, { binIndexToBin } from "./configs";
import { BetManager__factory } from "../typechain";
import { JsonRpcProvider } from "ethers";

export const calculateBinTicket = async (
  chainId: number,
  marketId: number,
  binIndex: number,
  amount: bigint
) => {
  const config = CONFIGS[chainId];
  const provider = new JsonRpcProvider(config.rpcUrl);
  const bm = BetManager__factory.connect(config.RangeBetManager, provider);
  const bin = binIndexToBin(binIndex);
  return bm.calculateXForBin(marketId, bin, amount);
};
