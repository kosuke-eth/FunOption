import predictPrice from "core/predict";
import { switchNetwork } from "appkit";
import { approveUSDC } from "core/token";
import { parseEther } from "ethers";
import { useNavigate } from "react-router-dom";
import { useGetSigner } from "utils/useGetSigner";
import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";
interface UseActionProps {
  chainId: number;
  currentBinId: number | null;
  selectedMarketId: number;
  amount: string;
  tickets: bigint;
  shouldApprove: boolean;
  refreshMap: () => Promise<void>;
}

type ActionState =
  | "connect-account"
  | "need-approve"
  | "approve-loading"
  | "can-predict"
  | "predict-loading"
  | "done";

export default function useAction({
  chainId,
  currentBinId,
  selectedMarketId,
  amount,
  tickets,
  shouldApprove,
  refreshMap,
}: UseActionProps) {
  const nav = useNavigate();
  const { address } = useAppKitAccount();
  const { open } = useAppKit();
  const getSigner = useGetSigner();

  const approve = async () => {
    try {
      setState("approve-loading");
      await switchNetwork(chainId);
      const signer = await getSigner();
      await approveUSDC(chainId, signer, parseEther(amount));
      setState("can-predict");
    } catch (error) {
      console.error(error);
      setState("need-approve");
    }
  };

  const predict = async () => {
    if (currentBinId === null) return;
    try {
      setState("predict-loading");
      console.log(chainId);
      await switchNetwork(chainId);
      const signer = await getSigner();
      await predictPrice(
        chainId,
        signer,
        selectedMarketId,
        currentBinId,
        tickets,
        parseEther(amount)
      );
      setState("done");
      await refreshMap();
    } catch (error) {
      console.error("Transaction Error??????!?@#!@#!@", error);
      setState("can-predict");
    }
  };

  const toProfile = () => {
    nav("/profile");
    setState("can-predict");
  };

  const [state, setState] = useState<ActionState>("need-approve");
  useEffect(() => {
    if (!address) {
      setState("connect-account");
    } else if (state === "done") {
      return;
    } else {
      setState(shouldApprove ? "need-approve" : "can-predict");
    }
  }, [address, shouldApprove]);

  const onClick = () => {
    if (state === "connect-account") {
      open();
    } else if (state === "need-approve") {
      approve();
    } else if (state === "can-predict") {
      predict();
    } else if (state === "done") {
      toProfile();
    }
  };

  return {
    onClick,
    state,
    msg:
      state === "connect-account"
        ? "Connect Wallet"
        : state === "need-approve"
        ? "Approve USDC"
        : state === "approve-loading"
        ? "Approving"
        : state === "can-predict"
        ? "Predict"
        : state === "predict-loading"
        ? "Placing Prediction"
        : state === "done"
        ? "Prediction Confirmed"
        : "",
  };
}
