import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import {
  AppKitNetwork,
  citreaTestnet,
  polygon,
  rootstockTestnet,
} from "@reown/appkit/networks";

const projectId = import.meta.env.VITE_PROJECT_ID;

export const supportedChains = [polygon, citreaTestnet, rootstockTestnet] as [
  AppKitNetwork,
  ...AppKitNetwork[]
];
const metadata = {
  name: "ethglobal-taipei",
  description: "AppKit Example",
  url: "https://reown.com/appkit", // origin must match your domain & subdomain
  icons: ["https://assets.reown.com/reown-profile-pic.png"],
};

const modal = createAppKit({
  adapters: [new EthersAdapter()],
  // networks: [polygonAmoy, flowTestnet, citreaTestnet, rootstockTestnet],
  networks: supportedChains,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

export const switchNetwork = async (chainId: number) => {
  if (modal.getChainId() === chainId) return;
  const chain = supportedChains.find((c) => c.id === chainId)!;
  modal.switchNetwork;
  return modal.switchNetwork(chain);
};
