import React from 'react';
import * as d3 from 'd3';
import { ChartDimensions } from './types';
import { ChartStyles } from '../colorUtils';

interface ChartBackgroundProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  dimensions: ChartDimensions;
}

/**
 * チャート背景コンポーネント
 * SVG全体の背景とチャート本体の背景を描画
 */
export const ChartBackground = ({ svg, chartGroup, dimensions }: ChartBackgroundProps) => {
  const { width, height, innerWidth, innerHeight } = dimensions;

  // グラフ全体の背景を追加 - マージンも含めた領域
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#13141b')
    .attr('rx', ChartStyles.sizes.borderRadius)
    .attr('ry', ChartStyles.sizes.borderRadius);

  // チャート本体の背景 - チャートグループの中に配置
  chartGroup
    .append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', '#1E1F2E') // 全体より少し明るい色
    .attr('rx', 2)
    .attr('ry', 2);
    
  return null; // 実際のレンダリングはD3で行うため、何もレンダリングしない
};
