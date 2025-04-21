import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, Eip1193Provider } from "ethers";

export function useGetSigner() {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");
  return async () => {
    if (!isConnected) throw Error("User disconnected");
    const ethersProvider = new BrowserProvider(walletProvider!);
    return ethersProvider.getSigner();
  };
}
