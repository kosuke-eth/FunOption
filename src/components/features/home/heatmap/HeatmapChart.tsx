import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { formatEther } from "ethers";
import { colorScale } from "./colorScale";
import { CHART_CONFIG } from "core/configs";
import { dollarFormatter } from "utils/formatter";
import cn from "utils/cn";

export interface HeatmapDatum {
  date: Date | string;
  values: bigint[];
  state: "closed" | "today" | "open";
}

export type HeatmapChartProps = {
  data: HeatmapDatum[];
  priceBins: number[];
  width?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  onBinClick: (marketId: number, binId: number) => void;
};

export default function HeatmapChart({
  data,
  priceBins,
  margin = { top: 0, right: 20, bottom: 40, left: 60 },
  onBinClick,
}: HeatmapChartProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredBin, setHoveredBin] = useState<{
    i: number;
    j: number;
    date: Date;
    price: string;
    tickets: number;
    perc: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      const newWidth = containerRef.current?.parentElement?.clientWidth ?? 0;
      setContainerWidth(newWidth);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current.parentElement!);

    return () => resizeObserver.disconnect();
  }, []);

  // x축 scale을 containerWidth 기준으로 수정
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
    .range([margin.left, containerWidth - margin.right]);

  // y축 scale
  const yScale = d3
    .scaleBand()
    .domain(priceBins.map(String))
    .range([CHART_CONFIG.height - margin.bottom, margin.top]);

  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (xAxisRef.current) {
      d3.select(xAxisRef.current)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(6)
            .tickSize(0)
            .tickFormat((d) => d3.timeFormat("%b %-d")(d as Date))
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g.selectAll(".tick text").attr("dy", "1em").style("font-size", "12px")
        );
    }
  }, [xScale]);

  useEffect(() => {
    if (yAxisRef.current) {
      d3.select(yAxisRef.current)
        .call(
          d3
            .axisLeft(yScale)
            .tickSize(0)
            .tickValues(
              yScale
                .domain()
                .filter(
                  (_, i) => i % Math.ceil(yScale.domain().length / 8) === 0
                )
            )
            .tickFormat((d) => {
              const num = parseFloat(d as string);
              return new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(num);
            })
        )
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick text").style("font-size", "12px"));
    }
  }, [yScale]);

  // 세로 셀 간의 간격만 추가
  const cellPadding = 1; // 세로 셀 간의 간격 (픽셀)
  const horizontalPadding = 1; // 가로 셀 간의 간격 (픽셀)
  const rectWidth =
    containerWidth > 0
      ? (containerWidth - margin.left - margin.right) / data.length -
        horizontalPadding
      : 0;
  const rectHeight = yScale.bandwidth() - cellPadding;

  const normalizedData = data.map((d) => {
    const sum = d.values.reduce((acc, value) => acc + +formatEther(value), 0);
    return sum > 0
      ? d.values.map((value) => +formatEther(value) / sum)
      : d.values.map(() => 0);
  });
  const maxValue = Math.max(...normalizedData.flat());
  const scaledData = normalizedData.map((d) =>
    d.map((value) => (maxValue > 0 ? value / maxValue : 0))
  );

  // 각 날짜별 최대 티켓 값을 가진 빈의 인덱스 계산
  const maxTicketIndices = data.map((d) => {
    const maxIndex = d.values.reduce(
      (maxIdx, value, idx, arr) =>
        +formatEther(value) > +formatEther(arr[maxIdx]) ? idx : maxIdx,
      0
    );
    return maxIndex;
  });

  // 라인 차트를 위한 데이터 포인트 생성
  const lineData = data
    .map((d, i) => ({
      date: new Date(d.date),
      price: parseFloat(priceBins[maxTicketIndices[i]].toString()),
      value: +formatEther(d.values[maxTicketIndices[i]]),
      state: d.state,
    }))
    .filter((d) => d.state === "closed" || d.state === "today");

  // 라인 생성기
  const line = d3
    .line<{ date: Date; price: number }>()
    .x((d) => xScale(d.date) + rectWidth / 2)
    .y((d) => yScale(d.price.toString())! + rectHeight / 2)
    .curve(d3.curveMonotoneX);

  // 점선 라인 생성기 추가
  const dashedLine = d3
    .line<{ date: Date; price: number }>()
    .x((d) => xScale(d.date) + rectWidth / 2)
    .y((d) => yScale(d.price.toString())! + rectHeight / 2)
    .curve(d3.curveMonotoneX);

  return (
    <div className="relative flex-1">
      <svg
        ref={containerRef}
        width="100%"
        height={CHART_CONFIG.height}
        viewBox={`0 0 ${containerWidth} ${CHART_CONFIG.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          ref={xAxisRef}
          transform={`translate(0,${CHART_CONFIG.height - margin.bottom})`}
        />
        <g ref={yAxisRef} transform={`translate(${margin.left},0)`} />

        {/* 배경 사각형 (셀 간격 색상) */}
        {data.map((d, i) => {
          const date = new Date(d.date);
          return priceBins.map((_, j) => (
            <rect
              key={`bg-${i}-${j}`}
              x={xScale(date)}
              y={yScale(priceBins[j].toString())!}
              width={rectWidth + horizontalPadding} // 오른쪽 간격까지 포함
              height={yScale.bandwidth()}
              className={cn(
                d.state === "closed" ? "fill-[#00000004] stroke-[#00000004]" : "fill-white"
              )}
            />
          ));
        })}

        {/* 히트맵 셀 */}
        {data.map((d, i) => {
          const date = new Date(d.date);
          const scaledValues = scaledData[i];
          const ticketSum = d.values.reduce(
            (acc, value) => acc + +formatEther(value),
            0
          );
          return scaledValues.map((value, j) => (
            <rect
              key={`${i}-${j}`}
              onClick={() => onBinClick(i, j)}
              x={xScale(date)}
              y={yScale(priceBins[j].toString())! + cellPadding / 2}
              width={rectWidth}
              height={rectHeight}
              className={`${colorScale(value, d.state === "closed")} ${
                j === hoveredBin?.j &&
                i === hoveredBin?.i &&
                "stroke-bitcoin stroke-2"
              }`}
              onMouseEnter={() => {
                setHoveredBin({
                  i,
                  j,
                  date,
                  price: priceBins[j].toString(),
                  tickets: +formatEther(d.values[j]),
                  perc: +formatEther(d.values[j]) / ticketSum,
                });
              }}
            />
          ));
        })}

        {/* 최대 티켓 값 라인 차트 - 실선 부분 */}
        <path
          d={line(lineData.filter((d) => d.state === "closed")) || ""}
          fill="none"
          stroke="#F7931A"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 최대 티켓 값 라인 차트 - 점선 부분 (today 상태) */}
        {lineData.some((d) => d.state === "today") && (
          <path
            d={
              dashedLine(
                lineData.filter(
                  (d) =>
                    d.state === "today" ||
                    (d.state === "closed" &&
                      lineData.some((item) => item.state === "today"))
                )
              ) || ""
            }
            fill="none"
            stroke="#F7931A"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3,3"
          />
        )}

        {/* 라인 차트 데이터 포인트 */}
        {lineData.map((d, i) => (
          <circle
            key={`point-${i}`}
            cx={xScale(d.date) + rectWidth / 2}
            cy={yScale(d.price.toString())! + rectHeight / 2}
            r={3}
            className="fill-bitcoin"
            style={{ display: d.state === "open" ? "none" : "block" }}
          />
        ))}
      </svg>

      {hoveredBin && (
        <div
          className="absolute space-y-2 w-44 bg-white text-surface-on px-4 py-3 rounded-lg shadow pointer-events-none z-10"
          style={{
            left: xScale(hoveredBin.date) + rectWidth / 2,
            top: yScale(hoveredBin.price)! - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex justify-between">
            <p className="text-[10px] text-surface-on-var">Date</p>
            <p className="text-xs font-bold text-surface-on">
              {d3.timeFormat("%-d %b %Y")(hoveredBin.date)}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-[10px] text-surface-on-var">Price</p>
            <p className="text-xs font-bold ">
              {dollarFormatter(hoveredBin.price)}-{dollarFormatter(+hoveredBin.price+500)}
            </p>
          </div>

          <hr className="border-outline-var" />
          <div className="flex justify-between">
            <p className="text-[10px] text-surface-on-var">Tickets</p>
            <p className="text-xs font-bold ">
              {hoveredBin.tickets} ({hoveredBin.perc.toFixed(2)}%)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
