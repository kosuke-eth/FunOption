import { Signer } from "ethers";
import { BetManager__factory } from "../typechain";
import CONFIGS, { binIndexToBin, GLOBAL_CONFIG } from "./configs";

async function predictPrice(
  chainId: number,
  signer: Signer,
  marketId: number,
  binIndex: number,
  ticket: bigint,
  amount: bigint
) {
  const config = CONFIGS[chainId];
  const bm = BetManager__factory.connect(config.RangeBetManager, signer);
  const bin = binIndexToBin(binIndex)
  const tx = await bm.buyTokens(marketId, [bin], [ticket], amount);
  const receipt = await tx.wait();
  return receipt;
}

export default predictPrice;
