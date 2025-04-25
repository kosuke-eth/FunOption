import { OptionData } from '../../../mockData/optionsMock';

// 共通の型定義
export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  innerWidth: number;
  innerHeight: number;
}

export interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  option: OptionData | null;
}

export interface ChartScales {
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
}
