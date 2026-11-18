export enum MoveType {
  up,
  down,
  top,
  bottom,
}

export enum ZoomMode {
  /**
   * 全屏铺满
   */
  auto,
  /**
   * 等比缩放宽度铺满
   */
  width,
  /**
   * 等比缩放高度铺满
   */
  height,
  /**
   * 等比缩放高度铺满并且可以左右移动
   */
  full,
  /**
   * 不缩放
   */
  disabled,
  /**
   * 响应式铺满：画布尺寸跟随视口，组件按画布比例用百分比定位，内容自适应、不缩放、不变形
   * （适用于 DifyRealDialog 等内部已是 flex 响应式的全屏组件，效果类似豆包网页版）
   */
  responsive,
}

export enum ToolboxType {
  vertical = 'vertical',
  horizontal = 'horizontal',
  copy = 'copy',
  add = 'add',
  remove = 'remove',
}

export const AnimationEasing = {
  linear: 'linear',
  quadraticIn: 'quadraticIn',
  quadraticOut: 'quadraticOut',
  quadraticInOut: 'quadraticInOut',
  cubicIn: 'cubicIn',
  cubicOut: 'cubicOut',
  cubicInOut: 'cubicInOut',
  quarticIn: 'quarticIn',
  quarticOut: 'quarticOut',
  quarticInOut: 'quarticInOut',
  quinticIn: 'quinticIn',
  quinticOut: 'quinticOut',
  quinticInOut: 'quinticInOut',
  sinusoidalIn: 'sinusoidalIn',
  sinusoidalOut: 'sinusoidalOut',
  sinusoidalInOut: 'sinusoidalInOut',
  exponentialIn: 'exponentialIn',
  exponentialOut: 'exponentialOut',
  exponentialInOut: 'exponentialInOut',
  circularIn: 'circularIn',
  circularOut: 'circularOut',
  circularInOut: 'circularInOut',
  elasticIn: 'elasticIn',
  elasticOut: 'elasticOut',
  elasticInOut: 'elasticInOut',
  backIn: 'backIn',
  backOut: 'backOut',
  backInOut: 'backInOut',
  bounceIn: 'bounceIn',
  bounceOut: 'bounceOut',
  bounceInOut: 'bounceInOut',
}
