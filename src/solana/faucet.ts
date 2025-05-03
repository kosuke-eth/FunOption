import idl from "../../public/spl_token_faucet.json";
import { Program, AnchorProvider, BN } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { connection } from "./connection";
import { useWallet } from "@solana/wallet-adapter-react";

const PROGRAM_ID = new PublicKey("4sN8PnN2ki2W4TFXAfzR645FWs8nimmsYeNtxM8RBK6A");
const MINT       = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

// USDC-DEV faucet呼び出しフック
export const useUsdcDevFaucet = () => {
  const wallet = useWallet();
  const provider = new AnchorProvider(connection, wallet as any, {});
  const program  = new Program(idl as any, PROGRAM_ID, provider);

  return async (amount = 10) => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    await program.methods
      .airdrop(new BN(amount * 1_000_000)) // 6 decimals
      .accounts({ mint: MINT, authority: wallet.publicKey })
      .rpc();
  };
};
