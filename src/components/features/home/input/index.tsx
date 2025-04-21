import "react-datepicker/dist/react-datepicker.css";
import { usePrediction } from "./usePrediction";
import { formatUnits, parseEther } from "ethers";
import useAction from "./useAction";
import cn from "utils/cn";
import { InputAmount } from "./InputAmount";
import { avgPriceFormatter, dollarFormatter } from "utils/formatter";
import { ToWin } from "./ToWin";

export default function PredictionInput({
  chainId,
  selectedMarketId,
  currentBinId,
  selectedDate,
  currBin,
  tickets,
  amount,
  setAmount,
  shouldApprove,
  balance,
  isTicketLoading,
  refreshMap,
}: ReturnType<typeof usePrediction>) {
  const avgPrice =
    tickets > 0n ? (parseEther(amount || "0") * parseEther("1")) / tickets : 0n;
  const action = useAction({
    chainId,
    currentBinId,
    selectedMarketId,
    amount,
    shouldApprove,
    tickets,
    refreshMap,
  });

  const avgPriceText = avgPriceFormatter(avgPrice);
  return (
    <div className="rounded-xl border border-outline-variant p-5">
      <div>
        <p className="text-surface-on-var font-medium">Prediction</p>
        <div className="flex justify-between mb-5">
          {currBin ? (
            <div className="font-bold text-xl">
              <p className="underline">
                {dollarFormatter(currBin[0])} ~ {dollarFormatter(currBin[1])}
              </p>
              <p>
                on{" "}
                <u>
                  {selectedDate.getDate()}{" "}
                  {selectedDate.toLocaleString("en-US", { month: "short" })}{" "}
                  {selectedDate.getFullYear()}
                </u>
              </p>
            </div>
          ) : (
            <p className="font-bold text-xl">Select your Prediction</p>
          )}
        </div>

        <hr className="border-outline-variant" />

        <div className="flex justify-between my-5">
          <p className="text-surface-on-var font-medium">avg price</p>
          <p className="text-xl font-bold">
            {isTicketLoading ? `...` : avgPriceText}
          </p>
        </div>

        <hr className="border-outline-variant" />

        <InputAmount amount={amount} setAmount={setAmount} balance={balance} />

        <hr className="border-outline-variant" />

        <ToWin
          isTicketLoading={isTicketLoading}
          tickets={tickets}
          avgPriceText={avgPriceText}
        />
      </div>

      {/* 베팅 버튼! */}
      <button
        onClick={action.onClick}
        className={cn(
          action.state === "done" ? "btn-secondary" : "btn-primary",
          "w-full"
        )}
        disabled={
          action.state === "approve-loading" ||
          action.state === "predict-loading"
        }
      >
        {action.msg}
      </button>
    </div>
  );
}
