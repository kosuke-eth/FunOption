import { JsonRpcProvider, parseEther, Signer } from "ethers";
import { ERC20__factory } from "../typechain";
import CONFIGS from "./configs";

export async function approveUSDC(chainId: number, signer: Signer, amount: bigint) {
  const config = CONFIGS[chainId];
  const USDC = ERC20__factory.connect(config.USDC, signer);
  const tx = await USDC.approve(config.RangeBetManager, amount);
  const receipt = await tx.wait();
  return receipt;
}

export async function getUSDC(chainId: number, signer: Signer) {
  const config = CONFIGS[chainId];
  const USDC = ERC20__factory.connect(config.USDC, signer);
  const tx = await USDC.requestTokens(parseEther("100"));
  const receipt = await tx.wait();
  return receipt;
}

export async function getAllowance(chainId: number, address: string) {
  const config = CONFIGS[chainId];
  const USDC = ERC20__factory.connect(
    config.USDC,
    new JsonRpcProvider(config.rpcUrl)
  );
  return USDC.allowance(address, config.RangeBetManager);
}

export async function getBalance(chainId: number, address: string): Promise<bigint> {
  const config = CONFIGS[chainId];
  const USDC = ERC20__factory.connect(config.USDC, new JsonRpcProvider(config.rpcUrl));
  return USDC.balanceOf(address);
}

