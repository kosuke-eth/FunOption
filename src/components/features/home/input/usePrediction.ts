import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInDays } from "date-fns";
import { calculateBinTicket } from "core/calculateBinTicket";
import { HeatmapDatum } from "../heatmap/HeatmapChart";
import { parseEther } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";
import { getAllowance, getBalance } from "core/token";
import { createPriceBins, GLOBAL_CONFIG } from "core/configs";
import getHeatmapData from "core/getHeatmapData";

export const usePrediction = (
  chainId: number,
  startDate: Date,
  startPrice: number,
  binCount: number
) => {
  const { address } = useAppKitAccount();
  const [isHeatmap, setIsHeatmap] = useState(true);

  // Date
  const [selectedMarketId, setSelectedMarketId] = useState<number>(6);
  // Price Bin
  const [currentBinId, setCurrentBinId] = useState<number | null>(null);
  const priceBins = useMemo(
    () => createPriceBins(startPrice, binCount),
    [startPrice, binCount]
  );

  const [tickets, setTickets] = useState<bigint>(0n);
  const [amount, setAmount] = useState<string>("1");
  const [balance, setBalance] = useState<bigint>(0n);
  const [heatmapData, setHeatmapData] = useState<HeatmapDatum[]>();
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(false);
  const [isTicketLoading, setIsTicketLoading] = useState<boolean>(false);

  const refreshBalance = async () => {
    if (address) {
      getAllowance(chainId, address).then(setAllowance);
      getBalance(chainId, address).then(setBalance);
    } else {
      setAllowance(0n);
      setBalance(0n);
    }
  };
  const refreshMap = async () => {
    setIsMapLoading(true);
    refreshBalance();
    return getHeatmapData(
      chainId,
      GLOBAL_CONFIG.dateCount,
      startDate,
      binCount
    ).then((data) => {
      setHeatmapData(data);
      setIsMapLoading(false);
    });
  };

  useEffect(() => {
    if (currentBinId !== null && heatmapData) {
      setIsTicketLoading(true);
      calculateBinTicket(
        chainId,
        selectedMarketId,
        currentBinId,
        parseEther(amount || "0")
      ).then((res) => {
        setTickets(res);
        setIsTicketLoading(false);
      });
    }
  }, [selectedMarketId, currentBinId, amount, heatmapData]);

  useEffect(() => {
    refreshMap();
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [address]);

  const currBin =
    currentBinId !== null
      ? [priceBins[currentBinId], priceBins[currentBinId + 1]]
      : null;

  const onBinClick = (marketId: number, binId: number) => {
    setCurrentBinId(binId);
    setSelectedMarketId(marketId);
    setIsHeatmap(false);
  };

  return {
    chainId,
    selectedDate: addDays(startDate, selectedMarketId),
    setSelectedDate: (date: Date) => {
      setSelectedMarketId(differenceInDays(date, startDate));
    },
    selectedMarketId,
    setSelectedMarketId,
    priceBins,
    binIndices: Array(binCount)
      .fill(0)
      .map((_, i) => i),
    currentBinId,
    setCurrentBinId,
    currBin,
    onBinClick,
    tickets,
    amount,
    setAmount,
    heatmapData,
    shouldApprove: allowance < parseEther(amount || "0"),
    balance,
    isTicketLoading,
    isMapLoading,
    refreshMap,
    isHeatmap,
    setIsHeatmap,
  };
};
