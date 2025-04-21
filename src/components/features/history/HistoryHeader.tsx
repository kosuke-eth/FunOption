export default function HistoryHeader() {
  return (
    <div className="flex gap-2 justify-center items-end h-[116px] pb-8">
      <span className="text-[28px] font-semibold mr-2">Your BTC</span>
      <img src="/images/BTC.png" className="w-12 h-12" />
      <span className="text-[28px] font-semibold ml-2">Prediction History</span>
    </div>
  );
}
