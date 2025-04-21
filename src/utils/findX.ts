import { ln } from "./log";
import { MaxUint256, parseEther } from "ethers";
import { sqrt } from "./sqrt";

const OPTIONS = {
  maxIter: 256,
  initialGuess: 0,
};

// cost = x + (q - T) * ln(((T+x)/T)
export function findX(cost: bigint, q: bigint, total: bigint): bigint {
  if (total === 0n) return cost;

  let left =
    (cost + sqrt((q - cost) * (q - cost) + 4n * cost * total) - q) / 2n;
  let right = q > 0n ? (total * cost) / q : MaxUint256;
  
  let x = (left + right) / 2n;
  for (let i = 0; i < OPTIONS.maxIter; i++) {
    // 만약 right - left = 1n이면 종료
    if (right - left <= 1n) return right;
    const y = calculateCost(x, q, total);
    let diff = y - cost;
    if (y === cost) return x;
    if (diff > 0n) {
      left = x;
    } else {
      right = x;
    }
    x = (left + right) / 2n;
  }
  return x;
}

function calculateCost(x: bigint, q: bigint, total: bigint): bigint {
  const one = parseEther("1");
  console.log(x, q, total, x + (q - total) * (ln(total + x) - ln(total)));
  return x + (q - total) * (ln(total + x) - ln(total));
}
