import cn from "utils/cn";
import { usePrediction } from "../input/usePrediction";
import { CHART_CONFIG } from "core/configs";
import { formatEther } from "ethers";
import { useEffect, useRef } from "react";

const Histogram = ({
  binIndices,
  priceBins,
  heatmapData,
  selectedMarketId,
  currentBinId,
  onBinClick,
  isHeatmap,
}: ReturnType<typeof usePrediction>) => {
  if (!heatmapData) return null;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedBinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      currentBinId !== undefined &&
      scrollContainerRef.current &&
      selectedBinRef.current
    ) {
      setTimeout(() => {
        selectedBinRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [isHeatmap, currentBinId, selectedMarketId]);

  const marketData = heatmapData[selectedMarketId];
  const totalShares = marketData.values.reduce((acc, curr) => acc + curr, 0n);

  const reversedBinIndices = [...binIndices].reverse();

  const shares = reversedBinIndices.map((binIndex) => {
    return totalShares > 0n
      ? Number((marketData.values[binIndex] * 10000n) / totalShares) / 100
      : 0;
  });
  const maxShare = Math.max(...shares);
  return (
    <div className="w-full" style={{ height: CHART_CONFIG.height }}>
      <div className="flex font-medium text-sm my-2">
        <div className="flex-1">PREDICTION</div>
        <div className="w-48 pl-4">SHARES</div>
      </div>

      <div
        ref={scrollContainerRef}
        className="space-y-px overflow-y-auto h-[calc(100%-2rem)]"
        style={{ maxHeight: "calc(100% - 2rem)" }}
      >
        {reversedBinIndices.map((binIndex) => {
          const min = priceBins[binIndex];
          const max = priceBins[binIndex + 1];
          const share =
            totalShares > 0n
              ? Number((marketData.values[binIndex] * 10000n) / totalShares) /
                100
              : 0;
          return (
            <div
              onClick={() => onBinClick(selectedMarketId, binIndex)}
              key={binIndex}
              ref={binIndex === currentBinId ? selectedBinRef : undefined}
              className={cn(
                "flex h-10 cursor-pointer",
                binIndex === currentBinId
                  ? "bg-bitcoin bg-opacity-20"
                  : "group hover:bg-primary-50 hover:bg-opacity-50"
              )}
            >
              <div className="flex-1 relative w-full">
                <div
                  className={cn(
                    "font-medium h-full",
                    binIndex === currentBinId
                      ? "bg-bitcoin opacity-100"
                      : "bg-primary-200 opacity-50 group-hover:bg-primary-200 group-hover:opacity-100"
                  )}
                  style={{
                    width: `${maxShare > 0 ? (100 * share) / maxShare : 0}%`,
                  }}
                />
                <div
                  className={cn(
                    "absolute inset-0 flex items-center pl-4",
                    binIndex === currentBinId
                      ? "text-black font-bold"
                      : " text-surface-on-var group-hover:text-surface-on group-hover:font-bold"
                  )}
                >
                  ${min.toLocaleString()} ~ ${max.toLocaleString()}
                </div>
              </div>
              <div className={cn("flex items-center w-48 pl-4")}>
                <p
                  className={
                    binIndex === currentBinId
                      ? "text-black font-bold"
                      : " text-surface-on-var group-hover:text-surface-on group-hover:font-bold"
                  }
                >
                  {share}% (
                  {(+formatEther(marketData.values[binIndex])).toFixed(2)})
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Histogram;
