import React from 'react';
import * as d3 from 'd3';
import { ChartDimensions } from './types';
import { ChartStyles } from '../colorUtils';

interface ChartLegendProps {
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  dimensions: ChartDimensions;
}

/**
 * チャート凡例コンポーネント
 * オプションタイプやその他の説明を表示する凡例
 */
export const ChartLegend = ({ chartGroup, dimensions }: ChartLegendProps) => {
  const { innerWidth, innerHeight } = dimensions;

  // 凡例の配置位置を設定
  const legendX = innerWidth - 120;
  const legendY = 20;
  const legendSpacing = 25;

  // 凡例グループを作成
  const legend = chartGroup.append('g')
    .attr('class', 'chart-legend')
    .attr('transform', `translate(${legendX}, ${legendY})`);

  // コール・プットオプションの凡例を表示
  legend.append('circle')
    .attr('cx', 10)
    .attr('cy', 0)
    .attr('r', 6)
    .attr('fill', ChartStyles.colors.call);

  legend.append('text')
    .attr('x', 25)
    .attr('y', 5)
    .attr('fill', ChartStyles.colors.legendText)
    .attr('font-size', ChartStyles.sizes.fontSize.small)
    .text('Call Option');

  legend.append('circle')
    .attr('cx', 10)
    .attr('cy', legendSpacing)
    .attr('r', 6)
    .attr('fill', ChartStyles.colors.put);

  legend.append('text')
    .attr('x', 25)
    .attr('y', legendSpacing + 5)
    .attr('fill', ChartStyles.colors.legendText)
    .attr('font-size', ChartStyles.sizes.fontSize.small)
    .text('Put Option');

  // 強度スケール凡例
  const intensityLegendX = 10;
  const intensityLegendY = innerHeight - 60;

  // 強度の凡例グループ
  const intensityLegend = chartGroup.append('g')
    .attr('class', 'intensity-legend')
    .attr('transform', `translate(${intensityLegendX}, ${intensityLegendY})`);

  // 強度ラベル
  intensityLegend.append('text')
    .attr('x', 0)
    .attr('y', -5)
    .attr('fill', ChartStyles.colors.legendText)
    .attr('font-size', ChartStyles.sizes.fontSize.small)
    .text('Buy Score Intensity');

  // 強度スケールの表示
  const intensityScaleWidth = 150;
  const intensityScaleHeight = 10;
  const intensityLevels = 5;

  for (let i = 0; i < intensityLevels; i++) {
    const intensity = i / (intensityLevels - 1);
    
    intensityLegend.append('rect')
      .attr('x', i * (intensityScaleWidth / intensityLevels))
      .attr('y', 5)
      .attr('width', intensityScaleWidth / intensityLevels)
      .attr('height', intensityScaleHeight)
      .attr('fill', ChartStyles.getIntensityColor(intensity))
      .attr('rx', 1)
      .attr('ry', 1);
  }

  // 強度スケールの最小値と最大値のラベル
  intensityLegend.append('text')
    .attr('x', 0)
    .attr('y', intensityScaleHeight + 20)
    .attr('text-anchor', 'start')
    .attr('fill', ChartStyles.colors.legendText)
    .attr('font-size', ChartStyles.sizes.fontSize.small)
    .text('Low');

  intensityLegend.append('text')
    .attr('x', intensityScaleWidth)
    .attr('y', intensityScaleHeight + 20)
    .attr('text-anchor', 'end')
    .attr('fill', ChartStyles.colors.legendText)
    .attr('font-size', ChartStyles.sizes.fontSize.small)
    .text('High');

  return null; // 実際のレンダリングはD3で行うため、何もレンダリングしない
};
