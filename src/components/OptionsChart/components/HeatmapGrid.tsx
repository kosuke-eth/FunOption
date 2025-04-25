import React from 'react';
import * as d3 from 'd3';
import { ChartDimensions, ChartScales, GridCell } from './types';
import { getIntensityColor } from '../colorUtils';
import { OptionData } from '../../../mockData/optionsMock';

interface HeatmapGridProps {
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  dimensions: ChartDimensions;
  scales: ChartScales;
  data: OptionData[];
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * ヒートマップグリッドコンポーネント
 * データに基づいてヒートマップのセルを生成して描画
 */
export const HeatmapGrid = ({ chartGroup, dimensions, scales, data, tooltipRef }: HeatmapGridProps) => {
  const { innerWidth, innerHeight } = dimensions;
  const { xScale, yScale } = scales;

  // 書式設定ヘルパー関数
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // セル数を計算
  const xGridSize = 24; // X方向のセル数
  const yGridSize = 15; // Y方向のセル数

  // セル間のパディングを小さく設定
  const cellPadding = 1; // セル間パディング（ピクセル）

  // セルサイズを計算
  const cellWidth = (innerWidth / xGridSize) - cellPadding;
  const cellHeight = (innerHeight / yGridSize) - cellPadding;

  // ストライク価格の範囲を取得
  const minStrike = d3.min(data, d => d.strike) || 0;
  const maxStrike = d3.max(data, d => d.strike) || 0;
  const strikeDomain = maxStrike - minStrike;

  // 価格の範囲を取得
  const minPrice = 0;
  const maxPrice = (d3.max(data, d => d.markPrice) || 0) * 1.1;

  // 均等間隔のストライクグリッドを作成
  const strikeValues = Array.from({ length: xGridSize }, (_, i) =>
    minStrike + (i / (xGridSize - 1)) * strikeDomain
  );

  // 均等間隔の価格グリッドを作成
  const priceValues = Array.from({ length: yGridSize }, (_, i) =>
    minPrice + (i / (yGridSize - 1)) * maxPrice
  );

  // グリッドデータ配列を生成
  const gridData: GridCell[] = [];

  // 各セルの値を計算
  for (let i = 0; i < xGridSize; i++) {
    const strikeValue = strikeValues[i];
    const xPos = xScale(strikeValue);

    for (let j = 0; j < yGridSize; j++) {
      const priceValue = priceValues[j];
      const yPos = yScale(priceValue);

      // セルの値を計算（最も近いデータポイントに基づく）
      let closestOption: OptionData | null = null;
      let minDistance = Number.MAX_VALUE;

      data.forEach(option => {
        const distance = Math.sqrt(
          Math.pow(option.strike - strikeValue, 2) +
          Math.pow(option.markPrice - priceValue, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestOption = option;
        }
      });

      // 強度を計算
      let intensity = 0;

      if (closestOption) {
        // 距離に基づいた強度の減衰を計算
        // 最大影響距離を刷った場合は強度ゼロ
        const maxDistance = Math.sqrt(Math.pow(strikeDomain / xGridSize * 3, 2) + Math.pow(maxPrice / yGridSize * 3, 2));
        intensity = Math.max(0, 1 - (minDistance / maxDistance));

        // buyScoreがあれば強度に反映
        const buyScore = (closestOption as any).buyScore;
        if (buyScore && typeof buyScore === 'number') {
          intensity = intensity * (buyScore / 100);
        } else {
          intensity = intensity * 0.5; // デフォルト値
        }
      }

      // セルデータを追加
      gridData.push({
        x: xPos,
        y: yPos,
        width: cellWidth,
        height: cellHeight,
        value: intensity,
        option: closestOption
      });
    }
  }

  // colorUtils.tsに定義した関数を使用して色を返す関数
  const getColor = (value: number) => getIntensityColor(value);

  // ヒートマップセルの描画
  chartGroup.selectAll('.heatmap-cell')
    .data(gridData)
    .enter()
    .append('rect')
    .attr('class', 'heatmap-cell')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('width', d => d.width)
    .attr('height', d => d.height)
    .attr('fill', d => getColor(d.value))
    .attr('opacity', 1)
    .attr('rx', 1)
    .attr('ry', 1)
    .on('mouseover', (event, d) => {
      // d.optionがnullの場合は何も表示しない
      if (!d.option) return;

      const tooltip = d3.select(tooltipRef.current);
      tooltip
        .style('display', 'block')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`)
        .html(`
          <div class="tooltip-content">
            <div>Type: ${d.option.type === 'call' ? 'Call' : 'Put'}</div>
            <div>Strike: ${formatCurrency(d.option.strike)}</div>
            <div>Price: ${formatCurrency(d.option.markPrice)}</div>
            <div>IV: ${d.option.iv}%</div>
            <div>Delta: ${d.option.delta.toFixed(2)}</div>
            <div>${d.option.expiry}</div>
          </div>
        `);
    })
    .on('mouseout', () => {
      const tooltip = d3.select(tooltipRef.current);
      tooltip.style('display', 'none');
    });

  return null; // 実際のレンダリングはD3で行うため、何もレンダリングしない
};
