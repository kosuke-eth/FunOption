import React from 'react';
import * as d3 from 'd3';
import { ChartDimensions, ChartScales } from './types';

interface CurrentPriceLineProps {
  chartGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  dimensions: ChartDimensions;
  scales: ChartScales;
  currentPrice: number;
}

/**
 * 現在価格線コンポーネント（無効化）
 * 現在の価格を表す線もラベルも描画しない
 */
export const CurrentPriceLine = ({}: CurrentPriceLineProps) => null;
