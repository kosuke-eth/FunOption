import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { OptionData } from '../../mockData/optionsMock';
import { getIntensityColor, ChartStyles } from './colorUtils';

interface OptionsChartProps {
  data: OptionData[];
  currentPrice: number;
  cryptoSymbol?: 'BTC' | 'ETH' | 'SOL'; // 表示する暗号通貨のシンボル
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
  cryptoSymbol = 'BTC', // デフォルト値をBTCに設定
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

    const isMobile = containerWidth < 640;
    const marginTop = Math.max(30, height * 0.10);
    const marginBottom = Math.max(70, height * 0.20);
    const marginLeft = isMobile ? Math.max(30, containerWidth * 0.10) : 80;
    const marginRight = isMobile ? Math.max(20, containerWidth * 0.05) : 60;
    const margin = { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Tooltip delay timer
    let tooltipTimeout: number | null = null;

    // スケール計算のための準備
    const validData = data.filter(d => typeof d.strike === 'number' && isFinite(d.strike) && typeof d.markPrice === 'number' && isFinite(d.markPrice));
    console.log('[Chart] Filtered validData:', validData); // Log filtered data

    const [minStrike, maxStrike] = d3.extent(validData, d => d.strike);
    const [minMarkPrice, maxMarkPrice] = d3.extent(validData, d => d.markPrice);

    // デフォルトのドメイン (データがない場合に備える)
    const defaultStrikeDomain: [number, number] = [0, 100000];
    const defaultMarkPriceDomain: [number, number] = [0, 100];

    // strike ドメインの決定
    let strikeDomain: [number, number];
    if (minStrike !== undefined && maxStrike !== undefined) {
      const padding = (maxStrike - minStrike) === 0 ? Math.max(1, maxStrike * 0.1) : Math.max(100, (maxStrike - minStrike) * 0.05); // 最小/最大が同じ場合は幅を持たせる + 最小5%パディング
      strikeDomain = [minStrike - padding, maxStrike + padding];
    } else {
      strikeDomain = defaultStrikeDomain;
    }
    // currentPrice も domain に含める
    if (typeof currentPrice === 'number' && isFinite(currentPrice)) {
      strikeDomain = [Math.min(strikeDomain[0], currentPrice * 0.9), Math.max(strikeDomain[1], currentPrice * 1.1)];
    }

    // markPrice ドメインの決定 (Y軸は0から開始)
    let markPriceDomainMax: number;
    if (maxMarkPrice !== undefined) {
      markPriceDomainMax = maxMarkPrice === 0 ? defaultMarkPriceDomain[1] : maxMarkPrice * 1.1; // 最大値が0の場合も考慮
    } else {
      markPriceDomainMax = defaultMarkPriceDomain[1];
    }
    const markPriceDomain: [number, number] = [0, markPriceDomainMax];
    console.log('[Chart] Calculated markPriceDomain:', markPriceDomain); // Log calculated domain

    // スケール
    const xScale = d3
      .scaleLinear()
      .domain(strikeDomain) // 修正されたドメインを使用
      .range([0, innerWidth])
      .clamp(true); // 範囲外の値をクリップ
    const yScale = d3
      .scaleLinear()
      .domain(markPriceDomain) // 修正されたドメインを使用
      .range([innerHeight, 0])
      .clamp(true); // 範囲外の値をクリップ

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
      { label: 'Premium', color: ChartStyles.colors.timeValue },
    ];

    const legendGroup = chartGroup
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, -40)`);

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

    /* ---------------------------- ヒートマップ凡例 ---------------------------- */
    const heatLegendWidth = 120;
    const heatLegendHeight = 8;
    const heatLegendGroup = chartGroup
      .append('g')
      .attr('class', 'heatmap-legend')
      .attr('transform', `translate(0, ${innerHeight + (marginBottom * 0.6)})`); // Position legend below title within dynamic margin
    // 凡例見出し: ヒートマップ強度を表示
    heatLegendGroup.append('text')
      .attr('x', 0)
      .attr('y', 12) // Made legend title more compact
      .attr('fill', ChartStyles.colors.legendText)
      .attr('font-size', ChartStyles.sizes.fontSize.small)
      .text('Proximity to nearest option');
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      heatLegendGroup.append('rect')
        .attr('x', i * (heatLegendWidth / steps))
        .attr('y', 28) // Shifted color bar down slightly
        .attr('width', heatLegendWidth / steps)
        .attr('height', heatLegendHeight)
        .attr('fill', getIntensityColor(i / steps, true));
    }
    heatLegendGroup.append('text')
      .attr('x', 0)
      .attr('y', 28 + heatLegendHeight + 10) // Adjusted 'Low' text for new color bar position (28 + 8 + 10 = 46)
      .attr('fill', ChartStyles.colors.legendText)
      .attr('font-size', ChartStyles.sizes.fontSize.small)
      .text('Low');
    heatLegendGroup.append('text')
      .attr('x', heatLegendWidth)
      .attr('y', 28 + heatLegendHeight + 10) // Adjusted 'High' text for new color bar position (28 + 8 + 10 = 46)
      .attr('text-anchor', 'end')
      .attr('fill', ChartStyles.colors.legendText)
      .attr('font-size', ChartStyles.sizes.fontSize.small)
      .text('High');

    /* ---------------------------- 軸 ---------------------------- */
    const xAxisG = chartGroup
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => formatCurrency(d as number)).ticks(Math.max(2, Math.floor(innerWidth / 100)))); // Dynamic ticks

    xAxisG.selectAll('text') // Style the tick labels
      .style('fill', ChartStyles.colors.axis)
      .style('font-size', ChartStyles.sizes.fontSize.small) // Changed to 'small' to fix TS error
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');

    // Append X-axis title to the xAxisG
    xAxisG.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', marginBottom * 0.4) // Position title within dynamic margin
      .attr('text-anchor', 'middle')
      .attr('fill', ChartStyles.colors.axisLabel)
      .style('font-size', ChartStyles.sizes.fontSize.small) // Ensure consistent font size
      .text(`Strike Price (${cryptoSymbol} / USDT)`);

    // Y-Axis
    chartGroup
      .append('g')
      .call(d3.axisLeft(yScale).tickFormat((d) => formatCurrency(d as number)).ticks(5))
      .selectAll('text')
      .style('fill', ChartStyles.colors.axis);

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
          const d = Math.hypot(o.strike - sx, (o.markPrice || 0) - sy);
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
          .attr('opacity', intensity * 0.35) // α 0.35 にさらに抑える
          .style('pointer-events', 'none')  // 点だけに Hover / Click を通す
          .attr('stroke-width', 0)
          .datum<OptionData | null>(closest);

        // ツールチップ表示
        rect
          .on('mouseover', (event, d: OptionData | null) => {
            if (!containerRef.current) return;
            const [x, y] = d3.pointer(event, containerRef.current);
            tooltipTimeout = window.setTimeout(() => {
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
                    (d.markPrice || 0),
                  )}</div>`,
                );
              } else {
                tooltipSel.html('<div>No data</div>');
              }
            }, 250);
          })
          .on('mouseout', () => {
            if (tooltipTimeout) {
              clearTimeout(tooltipTimeout);
              tooltipTimeout = null;
            }
            d3.select(tooltipRef.current).style('display', 'none');
          });
      }
    }

    /* ---------------------------- データポイント ---------------------------- */
    // Poor RRを除外
    const isPoorRR = (d: OptionData) => {
      // 安全に数値変換
      const markPrice = typeof d.markPrice === 'string' ? parseFloat(d.markPrice) : d.markPrice || 0;
      const strike = typeof d.strike === 'string' ? parseFloat(d.strike) : d.strike || currentPrice;
      const delta = typeof d.delta === 'string' ? parseFloat(d.delta) : d.delta || 0;
      
      // 計算に必要な数値の安全チェック
      if (isNaN(markPrice) || isNaN(strike)) return true;
      
      const safeMarkPrice = Math.max(0.01, markPrice);
      const safeStrike = strike;
      const safeDelta = delta;
      
      const intrinsic = d.type === 'call' ? 
        Math.max(0, currentPrice - safeStrike) : 
        Math.max(0, safeStrike - currentPrice);
        
      const timeValPct = ((Math.max(0, safeMarkPrice - intrinsic) / safeMarkPrice) * 100);
      const rrRaw = (Math.abs(safeDelta * 100) - timeValPct);
      
      return rrRaw < -10;
    };

    // ユーザー向けにポイントを絞り込み: 現在価格±20%以内かつ出来高上位30件
    const filteredData = data
      .filter((d) => {
        const strike = typeof d.strike === 'string' ? parseFloat(d.strike) : d.strike;
        const safeStrike = isNaN(strike) ? currentPrice : strike;
        return Math.abs(safeStrike - currentPrice) / currentPrice < 0.2;
      })
      .filter((d) => !isPoorRR(d))
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 15);
      
    // ホバー時のポイント制御
    const handleMouseOverPoint = (event: any, d: OptionData) => {
      if (!containerRef.current) return;
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
      
      chartGroup
        .selectAll<SVGCircleElement, OptionData>('.data-point')
        .transition()
        .duration(150)
        .attr('opacity', (p) => (p === d ? 1 : 0.3))
        .attr('stroke', (p) => (p === d ? 'white' : 'none'))
        .attr('stroke-width', (p) => (p === d ? 2 : 0))
        .attr('r', (p) => {
          if (p === d) {
            const vol = typeof p.volume === 'string' ? parseFloat(p.volume) : (p.volume || 0);
            return volumeScale(isNaN(vol) ? 0 : vol) * 1.5;
          } else {
            const vol = typeof p.volume === 'string' ? parseFloat(p.volume) : (p.volume || 0);
            return volumeScale(isNaN(vol) ? 0 : vol);
          }
        });

      const [x, y] = d3.pointer(event, containerRef.current);
      tooltipTimeout = window.setTimeout(() => {
        const tooltipSel = d3
          .select(tooltipRef.current)
          .style('display', 'block') // display:none を display:block に変更
          .style('left', `${x + 10}px`)
          .style('top', `${y - 10}px`);

        if (d) {
          tooltipSel.html(makeTooltipHtml(d));
        } else {
          tooltipSel.html('<div class="text-gray-300">No data</div>');
        }
      }, 250);
    };
    
    // ホバー解除時の処理
    const handleMouseOutPoint = () => {
      chartGroup
        .selectAll<SVGCircleElement, OptionData>('.data-point')
        .transition()
        .duration(150)
        .attr('opacity', 0.8)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2.5)
        .attr('r', (p) => {
          const vol = typeof p.volume === 'string' ? parseFloat(p.volume) : (p.volume || 0);
          return volumeScale(isNaN(vol) ? 0 : vol);
        });

      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      d3.select(tooltipRef.current).style('display', 'none');
    };
    
    // ボリュームスケール（円サイズに反映）
    const maxVolume = d3.max(filteredData, (d) => d.volume || 0) || 1;
    const volumeScale = d3
      .scaleSqrt<number, number>()
      .domain([0, maxVolume])
      .range([
        ChartStyles.sizes.pointRadius.small + 2,
        ChartStyles.sizes.pointRadius.large + 2,
      ]); // 元のサイズ設定に戻す
      
    // ツールチップ内容生成関数
    const makeTooltipHtml = (d: OptionData) => {
      // 安全に数値変換 - Bybit APIが文字列を返す場合に対応
      const markPrice = typeof d.markPrice === 'string' ? parseFloat(d.markPrice) : d.markPrice || 0;
      const strike = typeof d.strike === 'string' ? parseFloat(d.strike) : d.strike || currentPrice;
      const delta = typeof d.delta === 'string' ? parseFloat(d.delta) : d.delta || 0;
      const volume = typeof d.volume === 'string' ? parseFloat(d.volume) : d.volume || 0;
      const openInterest = typeof d.openInterest === 'string' ? parseFloat(d.openInterest) : d.openInterest || 0;
      const iv = typeof d.iv === 'string' ? parseFloat(d.iv) : d.iv || 0;
      
      // 数値計算 - 必ず安全なデフォルト値を設定
      const safeStrike = isNaN(strike) ? currentPrice : strike;
      const safeMarkPrice = Math.max(0.01, isNaN(markPrice) ? 0 : markPrice);
      const safeDelta = isNaN(delta) ? 0 : delta;
      
      const intrinsic = d.type === 'call' ? 
        Math.max(0, currentPrice - safeStrike) : 
        Math.max(0, safeStrike - currentPrice);
        
      const timeValPct = ((Math.max(0, safeMarkPrice - intrinsic) / safeMarkPrice) * 100).toFixed(0);
      const rrRaw = (Math.abs(safeDelta * 100) - Number(timeValPct));
      
      // バッジスタイル
      const rrBadge = rrRaw > 10 
        ? `<span class="badge badge-bullish">Good RR</span>` 
        : rrRaw < -10 
          ? `<span class="badge badge-bearish">Poor RR</span>` 
          : `<span class="badge badge-neutral">Neutral</span>`;
      
      // 安全に表示するヘルパー関数
      const formatNum = (val: number | null | undefined, format: (n: number) => string): string => {
        if (val === null || val === undefined || isNaN(val)) return 'N/A';
        return format(val);
      };
      
      // 通貨フォーマット関数
      const formatCurrency = (n: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 4
        }).format(n);
      };
          
      return `
        <div class="text-sm font-semibold text-white mb-1.5">${d.type === 'call' ? 'CALL' : 'PUT'} ${strike}</div>
        <div class="grid gap-1.5">
          <div class="flex justify-between">
            <span class="text-gray-400">Price:</span>
            <span class="text-white">${formatNum(safeMarkPrice, formatCurrency)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Bid/Ask:</span>
            <span class="text-white">${d.bid ?? 'N/A'} / ${d.ask ?? 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Volume:</span>
            <span class="text-white">${formatNum(volume, n => d3.format(",.0f")(n))}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Open Interest:</span>
            <span class="text-white">${formatNum(openInterest, n => d3.format(",.0f")(n))}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">IV:</span>
            <span class="text-white">${formatNum(iv, n => d3.format('.1%')(n))}</span>
          </div>
          <div class="mt-1.5">${rrBadge}</div>
        </div>    
      `;
    };
    
    // 円のデータポイント描画
    const dataPoints = chartGroup
      .selectAll<SVGCircleElement, OptionData>('.data-point')
      .data(filteredData)
      .join('circle')
      .attr('class', (d) => `data-point cursor-pointer ${d.type === 'call' ? 'call' : 'put'}`)
      .attr('cx', (d) => {
        const strike = typeof d.strike === 'string' ? parseFloat(d.strike) : (d.strike || currentPrice);
        return xScale(isNaN(strike) ? currentPrice : strike) || 0;
      })
      .attr('cy', (d) => {
        const price = typeof d.markPrice === 'string' ? parseFloat(d.markPrice) : (d.markPrice || 0);
        return yScale(isNaN(price) ? 0 : price) || 0;
      })
      .attr('r', (d) => {
        const vol = typeof d.volume === 'string' ? parseFloat(d.volume) : (d.volume || 0);
        // 初期半径は小さく設定し、アニメーションで大きくする
        return volumeScale(isNaN(vol) ? 0 : vol) * 0.7;
      })
      .attr('fill', (d) => d.type === 'call' ? ChartStyles.colors.call : ChartStyles.colors.put)
      .attr('opacity', 0.8)
      .attr('stroke', (d) => d.type === 'call' ? '#10b981' : '#ef4444')
      .attr('stroke-width', 1.5)
      .style('filter', (d) => d.type === 'call' ? 
        'drop-shadow(0 0 4px rgba(16,185,129,0.5))' : 
        'drop-shadow(0 0 4px rgba(239,68,68,0.5))')
      
    // 各データポイントにアニメーションを適用
    // 特定の間隔でパルスする効果を作成
    dataPoints.each(function(this: SVGCircleElement, d: OptionData, i: number) {
      const point = d3.select(this);
      const vol = typeof d.volume === 'string' ? parseFloat(d.volume) : (d.volume || 0);
      const baseRadius = volumeScale(isNaN(vol) ? 0 : vol);
      const delay = i * 150; // 各ポイントを別々のタイミングで開始
      
      function animatePoint() {
        point
          .transition()
          .delay(delay % 2000) // 受け取った遅延を適用
          .duration(1200)
          .attr('r', baseRadius * 1.3) // 拡大
          .attr('opacity', 1)
          .transition()
          .duration(1200)
          .attr('r', baseRadius * 0.8) // 縦小
          .attr('opacity', 0.7)
          .on('end', animatePoint); // 無限ループ
      }
      
      // アニメーション開始
      animatePoint();
    })
      .attr('aria-label', (d) => {
        const strike = typeof d.strike === 'string' ? parseFloat(d.strike) : d.strike;
        const delta = typeof d.delta === 'string' ? parseFloat(d.delta) : d.delta;
        const markPrice = typeof d.markPrice === 'string' ? parseFloat(d.markPrice) : d.markPrice;
        return `${d.type === 'call' ? 'Call' : 'Put'} ${strike}, Delta ${(delta || 0).toFixed(2)}, price ${formatCurrency(markPrice || 0)}`;
      })
      .attr('tabindex', 0)
      .on('mouseover', handleMouseOverPoint)
      .on('mouseout', handleMouseOutPoint)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedOption(d);
        if (onOptionSelect) {
          onOptionSelect(d);
        }
      });

    const deltaThresholds = [0.25, 0.5, 0.75];
    const callOptions = data.filter((d) => d.type === 'call');
    if (callOptions.length) {
      deltaThresholds.forEach((threshold) => {
        const closestCall = callOptions.reduce((prev, curr) => {
          const prevDelta = typeof prev.delta === 'string' ? parseFloat(prev.delta) : (prev.delta || 999);
          const currDelta = typeof curr.delta === 'string' ? parseFloat(curr.delta) : (curr.delta || 999);
          return Math.abs(currDelta - threshold) < Math.abs(prevDelta - threshold) ? curr : prev;
        });
        
        if (closestCall) {
          const strike = typeof closestCall.strike === 'string' ? parseFloat(closestCall.strike) : closestCall.strike;
          const xPos = xScale(isNaN(strike) ? currentPrice : strike);
          
          chartGroup
            .append('line')
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', 0)
            .attr('y2', innerHeight)
            .attr('stroke', 'gray')
            .attr('stroke-dasharray', '2 2');

          chartGroup
            .append('text')
            .attr('x', xPos + 4)
            .attr('y', 12)
            .attr('fill', 'gray')
            .attr('font-size', 10)
            .text(`Delta ${threshold}`);
        }
      });
    }

    const sortedData = [...data].sort((a, b) => {
      const aStrike = typeof a.strike === 'string' ? parseFloat(a.strike) : a.strike;
      const bStrike = typeof b.strike === 'string' ? parseFloat(b.strike) : b.strike;
      return (isNaN(aStrike) ? 0 : aStrike) - (isNaN(bStrike) ? 0 : bStrike);
    });
    
    const lineGenerator = d3
      .line<OptionData>()
      .x((d) => {
        const strike = typeof d.strike === 'string' ? parseFloat(d.strike) : (d.strike || 0);
        return xScale(isNaN(strike) ? 0 : strike);
      })
      .y((d) => {
        const price = typeof d.markPrice === 'string' ? parseFloat(d.markPrice) : (d.markPrice || 0);
        return yScale(isNaN(price) ? 0 : price);
      })
      .defined(d => {
        const strike = typeof d.strike === 'string' ? parseFloat(d.strike) : d.strike;
        const price = typeof d.markPrice === 'string' ? parseFloat(d.markPrice) : d.markPrice;
        return typeof strike === 'number' && isFinite(strike) && 
               typeof price === 'number' && isFinite(price);
      })
      .curve(d3.curveMonotoneX);

    if (sortedData.length > 0) {
      chartGroup
        .append('path')
        .datum(sortedData)
        .attr('class', 'price-line')
        .attr('fill', 'none')
        .attr('stroke', 'gray')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8)
        .attr('d', lineGenerator);
    }

    if (typeof currentPrice === 'number' && isFinite(currentPrice)) {
      const currentPriceX = xScale(currentPrice);
      chartGroup
        .append('line')
        .attr('x1', currentPriceX)
        .attr('x2', currentPriceX)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', 'gray')
        .attr('stroke-dasharray', '4 4');

      chartGroup
        .append('text')
        .attr('x', currentPriceX + 6)
        .attr('y', -6)
        .attr('fill', 'gray')
        .attr('font-size', 12)
        .text(`${cryptoSymbol}: ${formatCurrency(currentPrice)}`);
    }
  };

  useEffect(() => {
    console.log('[Chart] Effect triggered. Data length:', data?.length, 'CW:', containerWidth, 'H:', height, 'CP:', currentPrice);
    if (data && data.length > 0 && containerWidth > 0 && height > 0) {
      drawChart();
    } else {
      // Clear SVG if conditions for drawing are not met (e.g., no data, invalid dimensions)
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
        console.log('[Chart] Cleared SVG content.');
      }
    }
  }, [data, currentPrice, containerWidth, height]); // Added height to dependencies

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-b from-funoption-bg to-funoption-bg-dark rounded-2xl shadow-xl font-grotesk animate-fadeIn overflow-hidden" // Removed p-4
      style={{ height: `${height}px` }} // Apply the height prop here
    >
      <svg
        ref={svgRef}
        className="w-full h-full block overflow-visible" // Use h-full, retain overflow-visible
      />
      <div
        ref={tooltipRef}
        className="absolute z-50 hidden bg-funoption-bg/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-funoption-gold/30 text-xs pointer-events-none max-w-[220px] leading-relaxed"
      />
    </div>
  );
};

export default OptionsChart;
