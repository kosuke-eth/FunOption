export function colorScale(value: number, closed: boolean) {
  // ダークモード用のカラースケール
  // 低い値は暗い色、高い値は明るい色に
  if (value < 0.05) return closed ? "fill-dark-light" : "fill-[#232328]";
  if (value < 0.1) return "fill-primary-950";
  if (value < 0.2) return "fill-primary-900";
  if (value < 0.3) return "fill-primary-800";
  if (value < 0.4) return "fill-primary-700";
  if (value < 0.5) return "fill-primary-600";
  if (value < 0.6) return "fill-primary-500";
  if (value < 0.7) return "fill-primary-400";
  if (value < 0.8) return "fill-primary-300";
  if (value < 0.9) return "fill-primary-200";
  return "fill-primary-100";
}
