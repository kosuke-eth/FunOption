import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './OptionsChart.css';
import { OptionData } from '../../mockData/optionsMock';
import { getIntensityColor, ChartStyles } from './colorUtils';

interface OptionsChartProps {
  data: OptionData[];
  currentPrice: number;
  width?: number;
  height?: number;
  onOptionSelect?: (option: OptionData) => void;
}

/**
 * シンプルな単一ファイル版の OptionsChart。
 * D3 を直接使用してチャートを描画する。
 */
const OptionsChart: React.FC<OptionsChartProps> = ({
  data,
  currentPrice,
  width = 960,
  height = 600,
  onOptionSelect,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(width);

  /* ---------------------------- ヘルパー ---------------------------- */
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  /* ---------------------------- レスポンシブ ---------------------------- */
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      const newWidth = containerRef.current?.clientWidth ?? width;
      setContainerWidth(newWidth);
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [width]);

  /* ---------------------------- チャート描画 ---------------------------- */
  const drawChart = () => {
    if (!svgRef.current) return;

    const margin = { top: 60, right: 60, bottom: 80, left: 80 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // スケール
    const xScale = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.strike) || 0, d3.max(data, (d) => d.strike) || 0])
      .range([0, innerWidth]);
    const yScale = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.markPrice) || 0) * 1.1])
      .range([innerHeight, 0]);

    // SVG 初期化
    const svg = d3.select(svgRef.current).attr('width', containerWidth).attr('height', height);
    svg.selectAll('*').remove();

    // 背景
    svg
      .append('rect')
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('fill', ChartStyles.colors.background)
      .attr('rx', ChartStyles.sizes.borderRadius)
      .attr('ry', ChartStyles.sizes.borderRadius);

    const chartGroup = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    chartGroup
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', '#1E1F2E')
      .attr('rx', 2)
      .attr('ry', 2);

    /* ---------------------------- 凡例 ---------------------------- */
    const legendData = [
      { label: 'Premium', color: ChartStyles.colors.highlight },
      { label: 'Intrinsic', color: ChartStyles.colors.intrinsic },
      { label: 'Time Value', color: ChartStyles.colors.timeValue },
    ];

    const legendGroup = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left}, ${margin.top - 24})`);

    legendData.forEach((item, i) => {
      const g = legendGroup.append('g').attr('transform', `translate(${i * 120}, 0)`);

      g.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', item.color)
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round');

      g.append('text')
        .attr('x', 26)
        .attr('y', 4)
        .attr('fill', ChartStyles.colors.legendText)
        .attr('font-size', ChartStyles.sizes.fontSize.small)
        .text(item.label);
    });

    /* ---------------------------- 軸 ---------------------------- */
    chartGroup
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => formatCurrency(d as number)).ticks(5))
      .selectAll('text')
      .style('fill', ChartStyles.colors.axis);

    chartGroup
      .append('g')
      .call(d3.axisLeft(yScale).tickFormat((d) => formatCurrency(d as number)).ticks(5))
      .selectAll('text')
      .style('fill', ChartStyles.colors.axis);

    chartGroup
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', ChartStyles.colors.axisLabel)
      .text('Strike Price (USDT)');

    chartGroup
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -70)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', ChartStyles.colors.axisLabel)
      .text('Mark Price (USDT)');

    /* ---------------------------- ヒートマップ ---------------------------- */
    const xGrid = 24;
    const yGrid = 15;
    const cellW = innerWidth / xGrid;
    const cellH = innerHeight / yGrid;

    // 強度スケールをデータ範囲から動的に計算
    const strikeRange = xScale.domain()[1] - xScale.domain()[0];
    const priceRange = yScale.domain()[1] - yScale.domain()[0];
    const intensityScale = Math.hypot(strikeRange, priceRange) / 4; // 調整係数

    for (let i = 0; i < xGrid; i++) {
      for (let j = 0; j < yGrid; j++) {
        const sx = xScale.invert(i * cellW);
        const sy = yScale.invert(j * cellH);

        // 近いオプションとの距離で強度を算出
        let minDist = Infinity;
        let closest: OptionData | null = null;
        data.forEach((o) => {
          const d = Math.hypot(o.strike - sx, o.markPrice - sy);
          if (d < minDist) {
            minDist = d;
            closest = o;
          }
        });
        const intensity = closest ? Math.max(0, 1 - minDist / intensityScale) : 0;
        const rect = chartGroup
          .append('rect')
          .attr('class', 'heatmap-cell')
          .attr('x', i * cellW)
          .attr('y', j * cellH)
          .attr('width', cellW)
          .attr('height', cellH)
          .attr('fill', getIntensityColor(intensity, true))
          .attr('opacity', intensity)
          .attr('stroke-width', 0)
          .datum<OptionData | null>(closest);

        // ツールチップ表示
        rect
          .on('mouseover', (event, d: OptionData | null) => {
            if (!containerRef.current) return;
            const [x, y] = d3.pointer(event, containerRef.current);
            const tooltipSel = d3
              .select(tooltipRef.current)
              .style('display', 'block')
              .style('left', `${x + 10}px`)
              .style('top', `${y - 10}px`);

            if (d) {
              tooltipSel.html(
                `<div class="tooltip-strike">Strike: ${formatCurrency(
                  d.strike,
                )}</div><div class="tooltip-price">Price: ${formatCurrency(
                  d.markPrice,
                )}</div>`,
              );
            } else {
              tooltipSel.html('<div>No data</div>');
            }
          })
          .on('mouseout', () => {
            d3.select(tooltipRef.current).style('display', 'none');
          });
      }
    }

    /* ---------------------------- データポイント ---------------------------- */
    // hover state helpers
    const handleMouseOverPoint = (event: any, d: OptionData) => {
      if (!containerRef.current) return;
      // highlight same strike points
      chartGroup
        .selectAll<SVGCircleElement, OptionData>('.data-point')
        .classed('dimmed', (p) => p.strike !== d.strike)
        .classed('highlight', (p) => p.strike === d.strike);

      const [x, y] = d3.pointer(event, containerRef.current);
      const tooltipSel = d3
        .select(tooltipRef.current)
        .style('display', 'block')
        .style('left', `${x + 10}px`)
        .style('top', `${y - 10}px`)
        .html(makeTooltipHtml(d));
    };

    const handleMouseOutPoint = () => {
      chartGroup.selectAll('.data-point').classed('dimmed highlight', false);
      d3.select(tooltipRef.current).style('display', 'none');
    };

    const makeTooltipHtml = (d: OptionData) => {
      const intrinsic = d.type === 'call' ? Math.max(0, currentPrice - d.strike) : Math.max(0, d.strike - currentPrice);
      const timeValPct = ((Math.max(0, d.markPrice - intrinsic) / d.markPrice) * 100).toFixed(0);
      // risk-reward: delta×100 vs timeValPct 差を簡易指標
      const rrRaw = (Math.abs(d.delta) * 100 - Number(timeValPct));
      const rrBadge = rrRaw > 10 ? `<span class="badge badge-bullish">Good RR</span>` : rrRaw < -10 ? `<span class="badge badge-bearish">Poor RR</span>` : `<span class="badge badge-neutral">Neutral</span>`;
      return `
        <div class="tooltip-strike">Strike: ${formatCurrency(d.strike)}</div>
        <div class="tooltip-price">Price: ${formatCurrency(d.markPrice)}</div>
        <div class="tooltip-delta">Δ: ${d.delta.toFixed(2)}</div>
        <div class="tooltip-volume">Vol: ${d.volume}</div>
        <div class="tooltip-risk">TimeVal/Price: ${timeValPct}%</div>
        <div class="tooltip-rr">${rrBadge}</div>`;
    };

    // ボリュームスケール（円サイズに反映）
    const maxVolume = d3.max(data, (d) => d.volume) || 1;
    const volumeScale = d3.scaleSqrt<number, number>().domain([0, maxVolume]).range([ChartStyles.sizes.pointRadius.small, ChartStyles.sizes.pointRadius.large]);

    chartGroup
      .selectAll('.data-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', (d) => {
        const intrinsic = d.type === 'call' ? Math.max(0, currentPrice - d.strike) : Math.max(0, d.strike - currentPrice);
        const timeVal = Math.max(0, d.markPrice - intrinsic);
        const totalRisk = timeVal / (d.markPrice || 1);
        const isRecommend = Math.abs(d.strike - currentPrice) / currentPrice < 0.05 && totalRisk > 0.4 && totalRisk < 0.6;
        return isRecommend ? 'data-point recommend' : 'data-point';
      })
      .attr('cx', (d) => xScale(d.strike))
      .attr('cy', (d) => yScale(d.markPrice))
      .attr('r', (d) => {
        const intrinsic = d.type === 'call' ? Math.max(0, currentPrice - d.strike) : Math.max(0, d.strike - currentPrice);
        const timeVal = Math.max(0, d.markPrice - intrinsic);
        const totalRisk = timeVal / (d.markPrice || 1);
        const isRecommend = Math.abs(d.strike - currentPrice) / currentPrice < 0.05 && totalRisk > 0.4 && totalRisk < 0.6;
        const baseR = volumeScale(d.volume);
        return isRecommend ? baseR + 2 : baseR;
      })
      .attr('fill', (d) => {
        const intrinsic = d.type === 'call' ? Math.max(0, currentPrice - d.strike) : Math.max(0, d.strike - currentPrice);
        const timeVal = Math.max(0, d.markPrice - intrinsic);
        const totalRisk = timeVal / (d.markPrice || 1);
        const color = d.type === 'call' ? ChartStyles.colors.call : ChartStyles.colors.put;
        return totalRisk < 0.3 || totalRisk > 0.7 ? d3.color(color)!.darker(0.5).toString() : color;
      })
      .on('mouseover', handleMouseOverPoint)
      .on('mouseout', handleMouseOutPoint)
      .on('click', (event, d) => {
        setSelectedOption(d);
        onOptionSelect?.(d);
      });

    // 推奨オプションの円を最前面に移動
    chartGroup.selectAll('.recommend').raise();

    /* --------- デルタ帯を示すガイドライン (0.25 / 0.50 / 0.75) --------- */
    const deltaThresholds = [0.25, 0.5, 0.75];
    const callOptions = data.filter((d) => d.type === 'call');
    if (callOptions.length) {
      deltaThresholds.forEach((thr) => {
        const closestCall = callOptions.reduce((prev, curr) =>
          Math.abs(curr.delta - thr) < Math.abs(prev.delta - thr) ? curr : prev,
        );
        if (closestCall) {
          const xPos = xScale(closestCall.strike);
          chartGroup
            .append('line')
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', '#444')
            .attr('stroke-dasharray', '2 2');

          chartGroup
            .append('text')
            .attr('x', xPos + 4)
            .attr('y', 12)
            .attr('fill', '#666')
            .attr('font-size', 10)
            .text(`Δ ${thr}`);
        }
      });
    }

    /* ---------------------------- データライン ---------------------------- */
    const sortedData = [...data].sort((a, b) => a.strike - b.strike);
    const lineGenerator = d3
      .line<OptionData>()
      .x((d) => xScale(d.strike))
      .y((d) => yScale(d.markPrice))
      .curve(d3.curveMonotoneX);

    chartGroup
      .append('path')
      .datum(sortedData)
      .attr('class', 'price-line')
      .attr('fill', 'none')
      .attr('stroke', ChartStyles.colors.highlight)
      .attr('stroke-width', ChartStyles.sizes.lineWidth.normal)
      .attr('d', lineGenerator);

    /* ------------------------ 内在価値ライン ------------------------ */
    const intrinsicData = sortedData.map((d) => {
      const intrinsic = d.type === 'call' ? Math.max(0, currentPrice - d.strike) : Math.max(0, d.strike - currentPrice);
      return { ...d, intrinsic };
    });

    const intrinsicLine = d3
      .line<typeof intrinsicData[0]>()
      .x((d) => xScale(d.strike))
      .y((d) => yScale(d.intrinsic))
      .curve(d3.curveMonotoneX);

    chartGroup
      .append('path')
      .datum(intrinsicData)
      .attr('class', 'intrinsic-line')
      .attr('fill', 'none')
      .attr('stroke', ChartStyles.colors.intrinsic)
      .attr('stroke-width', ChartStyles.sizes.lineWidth.thin)
      .attr('stroke-dasharray', '3 3')
      .attr('d', intrinsicLine);

    /* ------------------------ 時間価値ライン ------------------------ */
    const timeValueData = sortedData.map((d, i) => {
      const intrinsic = intrinsicData[i].intrinsic;
      const timeVal = Math.max(0, d.markPrice - intrinsic);
      return { ...d, timeVal };
    });

    const timeValueLine = d3
      .line<typeof timeValueData[0]>()
      .x((d) => xScale(d.strike))
      .y((d) => yScale(d.timeVal))
      .curve(d3.curveMonotoneX);

    chartGroup
      .append('path')
      .datum(timeValueData)
      .attr('class', 'timevalue-line')
      .attr('fill', 'none')
      .attr('stroke', ChartStyles.colors.timeValue)
      .attr('stroke-width', ChartStyles.sizes.lineWidth.thin)
      .attr('stroke-dasharray', '4 2')
      .attr('d', timeValueLine);

    /* ---------------------------- 現在価格線 ---------------------------- */
    // 現在価格の横線とラベルは UI 方針により不要のため削除

    chartGroup
      .append('line')
      .attr('x1', xScale(currentPrice))
      .attr('x2', xScale(currentPrice))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', ChartStyles.colors.currentPrice)
      .attr('stroke-dasharray', '4 4');

    // ラベル（縦線の上部）
    chartGroup
      .append('text')
      .attr('x', xScale(currentPrice) + 6)
      .attr('y', -6)
      .attr('text-anchor', 'start')
      .attr('fill', ChartStyles.colors.currentPrice)
      .attr('font-size', 12)
      .text(`BTC: ${formatCurrency(currentPrice)}`);

    // SVG 初期化
  };

  /* ---------------------------- Effect ---------------------------- */
  useEffect(() => {
    if (data.length) drawChart();
  }, [data, currentPrice, containerWidth]);

  /* ---------------------------- JSX ---------------------------- */
  return (
    <div className="options-chart-container" ref={containerRef}>
      <svg ref={svgRef} width={width} height={height} />
      <div className="tooltip" ref={tooltipRef} />
      {selectedOption && (
        <div className="selected-option-info">
          <h3>Selected Option</h3>
          <div className="selected-option-details">
            <span>Strike: {formatCurrency(selectedOption.strike)}</span>
            <span>Price: {formatCurrency(selectedOption.markPrice)}</span>
            <span>Δ: {selectedOption.delta.toFixed(2)}</span>
            <span>Vol: {selectedOption.volume}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsChart;
