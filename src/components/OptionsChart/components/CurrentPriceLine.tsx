import React from 'react';
import * as d3 from 'd3';
import { ChartDimensions, ChartScales } from './types';
import { ChartStyles } from '../colorUtils';

interface CurrentPriceLineProps {
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  dimensions: ChartDimensions;
  scales: ChartScales;
  currentPrice: number;
}

/**
 * 現在価格線コンポーネント
 * 現在の価格を表す横線を描画
 */
export const CurrentPriceLine = ({ chartGroup, dimensions, scales, currentPrice }: CurrentPriceLineProps) => {
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

  // 現在価格線の描画
  const currentPriceLine = chartGroup
    .append('line')
    .attr('class', 'current-price-line')
    .attr('x1', 0)
    .attr('y1', yScale(currentPrice))
    .attr('x2', innerWidth)
    .attr('y2', yScale(currentPrice))
    .attr('stroke', ChartStyles.colors.currentPrice)
    .attr('stroke-width', ChartStyles.sizes.strokeWidth.medium)
    .attr('stroke-dasharray', '5,5');

  // 現在価格ラベルの表示
  chartGroup
    .append('text')
    .attr('class', 'current-price-label')
    .attr('x', innerWidth - 5)
    .attr('y', yScale(currentPrice) - 5)
    .attr('text-anchor', 'end')
    .attr('fill', ChartStyles.colors.currentPrice)
    .attr('font-size', ChartStyles.sizes.fontSize.normal)
    .text(`Current: ${formatCurrency(currentPrice)}`);
    
  return null; // 実際のレンダリングはD3で行うため、何もレンダリングしない
};
