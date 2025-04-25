import React from 'react';
import * as d3 from 'd3';
import { ChartDimensions, ChartScales } from './types';
import { ChartStyles } from '../colorUtils';
import { OptionData } from '../../../mockData/optionsMock';

interface ChartAxesProps {
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  dimensions: ChartDimensions;
  scales: ChartScales;
  data: OptionData[];
  currentPrice: number;
}

/**
 * チャート軸コンポーネント
 * X軸とY軸を描画する
 */
export const ChartAxes = ({ chartGroup, dimensions, scales, data, currentPrice }: ChartAxesProps) => {
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

  // X軸のスケールを作成（ストライク価格用）
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => formatCurrency(d as number))
    .ticks(5);

  // Y軸のスケールを作成（マーク価格用）
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => formatCurrency(d as number))
    .ticks(5);

  // X軸を描画
  chartGroup.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .attr('class', 'x-axis')
    .style('color', ChartStyles.colors.axis) // D3で直接スタイル指定
    .style('font-size', ChartStyles.sizes.fontSize.normal) // D3で直接スタイル指定
    .call(xAxis);

  // Y軸を描画
  chartGroup.append('g')
    .attr('class', 'y-axis')
    .style('color', ChartStyles.colors.axis) // D3で直接スタイル指定
    .style('font-size', ChartStyles.sizes.fontSize.normal) // D3で直接スタイル指定
    .call(yAxis);

  // 軸ラベルの追加（X軸）
  chartGroup.append('text')
    .attr('class', 'x-axis-label')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', ChartStyles.colors.axisLabel)
    .attr('font-size', ChartStyles.sizes.fontSize.normal)
    .text('Strike Price');

  // 軸ラベルの追加（Y軸）
  chartGroup.append('text')
    .attr('class', 'y-axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', -40)
    .attr('x', -innerHeight / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', ChartStyles.colors.axisLabel)
    .attr('font-size', ChartStyles.sizes.fontSize.normal)
    .text('Mark Price');
    
  return null; // 実際のレンダリングはD3で行うため、何もレンダリングしない
};
