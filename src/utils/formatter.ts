import { formatUnits } from "ethers";

// dollar formatter, comma separated, decimal point 2
export const dollarFormatter = (
  value: number | string | undefined | null,
  minDecimals = 0,
  maxDecimals = 2
) => {
  if (value === undefined || value === null) return "$0";

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return `$${Intl.NumberFormat("en-US", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(numValue)}`;
};

export const avgPriceFormatter = (avgPrice: bigint) => {
  return `${
    Math.floor(Number(formatUnits(avgPrice ? avgPrice : "0", 15))) / 10
  }¢`;
};