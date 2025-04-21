import HeatmapChart from "./heatmap/HeatmapChart";
import ToggleChartSwitch from "./ToggleChartSwitch";
import PredictionInput from "./input";
import { GLOBAL_CONFIG } from "../../../core/configs";
import { usePrediction } from "./input/usePrediction";
import Histogram from "./histogram";
import { DatePickerItem } from "./DatePickerItem";

export default function Home() {
  const input = usePrediction(
    GLOBAL_CONFIG.chainId,
    GLOBAL_CONFIG.startDate,
    GLOBAL_CONFIG.startPrice,
    GLOBAL_CONFIG.binCount
  );

  return (
    <div className="flex flex-col gap-2 py-9">
      <div className="flex gap-2">
      <ToggleChartSwitch
        isHeatmap={input.isHeatmap}
        setIsHeatmap={input.setIsHeatmap}
        />
        <DatePickerItem {...input} />
      </div>
      <div className="flex gap-12">
        <div className="flex flex-[2.5]">
          {input.heatmapData &&
            (input.isHeatmap ? (
              <HeatmapChart
                data={input.heatmapData}
                priceBins={input.priceBins}
                onBinClick={input.onBinClick}
              />
            ) : (
              <Histogram {...input} />
            ))}
        </div>
        <div className="min-w-[340px]">
          <PredictionInput {...input} />
        </div>
      </div>
    </div>
  );
}
