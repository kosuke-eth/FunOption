import { formatEther } from "ethers/utils";
import { dollarFormatter } from "utils/formatter";

export const ToWin = ({
  isTicketLoading,
  tickets,
  avgPriceText,
}: {
  isTicketLoading: boolean;
  tickets: bigint;
  avgPriceText: string;
}) => {
  return (
    <div className="flex justify-between my-5">
      <div>
        <p className="text-surface-on-var font-medium">To win</p>
        <p className="text-surface-on-var text-sm">Avg {avgPriceText}</p>
      </div>
      <p className="text-positive font-bold text-xl">
        {isTicketLoading ? `...` : `${dollarFormatter(formatEther(tickets))}`}
      </p>
    </div>
  );
};
