import React from 'react';
import * as d3 from 'd3';
import { ChartDimensions, ChartScales } from './types';
import { ChartStyles } from '../colorUtils';
import { OptionData } from '../../../mockData/optionsMock';

interface DataPointsProps {
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  dimensions: ChartDimensions;
  scales: ChartScales;
  data: OptionData[];
  selectedOption: OptionData | null;
  setSelectedOption: (option: OptionData | null) => void;
}

/**
 * データポイントコンポーネント
 * 各オプションのデータポイントを描画
 */
export const DataPoints = ({ chartGroup, dimensions, scales, data, selectedOption, setSelectedOption }: DataPointsProps) => {
  const { xScale, yScale } = scales;

  // 各データポイントを描画
  chartGroup.selectAll('.data-point')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(d.strike))
    .attr('cy', d => yScale(d.markPrice))
    .attr('r', d => {
      // 選択されたオプションは大きく表示
      if (selectedOption && selectedOption.strike === d.strike && selectedOption.markPrice === d.markPrice) {
        return ChartStyles.sizes.dataPoint.selected;
      }
      return ChartStyles.sizes.dataPoint.normal;
    })
    .attr('fill', d => d.type === 'call' ? ChartStyles.colors.call : ChartStyles.colors.put)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1)
    .attr('opacity', 0.7)
    .on('click', (event, d) => {
      // オプションの選択処理
      setSelectedOption(d);
    });

  return null; // 実際のレンダリングはD3で行うため、何もレンダリングしない
};
