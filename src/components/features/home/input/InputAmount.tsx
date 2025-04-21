import { formatEther } from "ethers";
import { dollarFormatter } from "utils/formatter";
interface InputAmountProps {
  amount: string;
  setAmount: (amount: string) => void;
  balance: bigint;
}

export const InputAmount = ({
  amount,
  setAmount,
  balance,
}: InputAmountProps) => {
  const onChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 정규식 수정 - 소수점만 있는 경우(예: "3.")도 허용
    const regex = /^[0-9]*\.?[0-9]*$/;
    // 소수점 이하 18자리 제한 로직 추가
    if (regex.test(e.target.value)) {
      const parts = e.target.value.split(".");
      if (parts.length === 2 && parts[1].length > 18) {
        return; // 소수점 이하 18자리 초과시 입력 무시
      }
      setAmount(e.target.value);
    }
  };

  const handleAddAmount = (addAmount: string) => {
    if (addAmount === "Max") {
      setAmount(formatEther(balance));
    } else {
      setAmount(String(+amount + +addAmount));
    }
  };

  return (
    <div className="py-5">
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-surface-on-var font-medium">Amount</span>
          <p className="text-surface-on-var text-xs mt-1">Your confidence 🙌</p>
        </div>
        <div>
          <div className="inline-flex items-center text-xl font-bold ">
            <input
              value={amount}
              onChange={onChangeValue}
              className="outline-none text-right"
              placeholder="$0"
            />
            <p className="ml-1">USDC</p>
          </div>

          <p className="text-surface-on-var text-xs text-right">
            Balance: {formatEther(balance)}
          </p>
        </div>
      </div>

      {/* 금액 빠른 버튼 */}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => handleAddAmount("1")} className="chip">
          +$1
        </button>
        <button onClick={() => handleAddAmount("20")} className="chip">
          +$20
        </button>
        <button onClick={() => handleAddAmount("100")} className="chip">
          +$100
        </button>
        <button onClick={() => handleAddAmount("Max")} className="chip">
          Max
        </button>
      </div>
    </div>
  );
};
