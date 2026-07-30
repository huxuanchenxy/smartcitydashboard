import { AnimationEasing } from "@/utils/enums";
// 动画名称
export const animationTypes = [
  { id: "Updown", value: "上下摆动" },
  { id: "Rotate", value: "旋转" },
  { id: "GrowShrink", value: "缩放" },
  { id: "ZoomSpin", value: "旋转-缩放" },
  { id: "ZoomInCenter", value: "逐渐放大" },
  { id: "Swing", value: "左摇右摆" },
  { id: "Blink", value: "闪烁" },
  { id: "Breathing", value: "呼吸灯" },
  { id: "FadeInOut", value: "淡入淡出" },
  { id: "BounceIn", value: "弹跳进入" },
  { id: "Jitter", value: "抖动" },
  { id: "Wave", value: "波纹变形" }
];

export const animationState = [
  { id: "running", value: "运行" },
  { id: "paused", value: "暂停" }
];

export const enableTypes = [
  { id: true, value: "开启" },
  { id: false, value: "关闭" }
];

// 动画速率
export const rateTypes = [
  { id: "linear", value: "线性过渡" },
  { id: "ease", value: "平滑过渡" },
  { id: "ease-in", value: "由慢到快" },
  { id: "ease-out", value: "由快到慢" },
  { id: "ease-in-out", value: "双向平滑" },
  { id: "step-start", value: "立即跳变" },
  { id: "step-end", value: "最终跳变" }
];
// 重复次数
export const repetitionTypes = [
  { id: "infinite", value: "无限" },
  { id: "1", value: "1次" },
  { id: "2", value: "2次" },
  { id: "5", value: "5次" },
  { id: "10", value: "10次" }
];

// 重复频率
export const frequencyTypes = [
  { id: "normal", value: "正常播放" },
  { id: "reverse", value: "反向播放" },
  { id: "alternate", value: "奇数正常，偶数反向" },
  { id: "alternate-reverse", value: "奇数反向，偶数正常" }
];

export const fontFamilys = [
  { id: "Microsoft Yahei", value: "微软雅黑" },
  { id: "SimSun", value: "宋体" },
  { id: "SimHei", value: "黑体" },
  { id: "LiSu", value: "隶书" },
  { id: "YouYuan", value: "幼圆" },
  { id: "tahoma", value: "tahoma" },
  { id: "arial", value: "arial" },
  { id: "sans-serif", value: "sans-serif" },
  { id: "旁门正道标题体", value: "旁门正道标题体" },
  { id: "思源黑体Bold", value: "思源黑体Bold" },
  { id: "思源黑体ExtraLight", value: "思源黑体ExtraLight" },
  { id: "思源黑体Heavy", value: "思源黑体Heavy" },
  { id: "思源黑体Light", value: "思源黑体Light" },
  { id: "思源黑体Medium", value: "思源黑体Medium" },
  { id: "思源黑体Normal", value: "思源黑体Normal" },
  { id: "DS-DIGI", value: "DS-DIGI" },
  { id: "DS-DIGIB", value: "DS-DIGIB" }
];

export const fontWeights = [
  { id: "lighter", value: "细" },
  { id: "normal", value: "正常" },
  { id: "bolder", value: "粗" },
  { id: "100", value: "100" },
  { id: "200", value: "200" },
  { id: "300", value: "300" },
  { id: "400", value: "400" },
  { id: "500", value: "500" },
  { id: "600", value: "600" },
  { id: "700", value: "700" },
  { id: "800", value: "800" },
  { id: "900", value: "900" }
];

export const fontStyles = [
  { id: "italic", value: "斜体" },
  { id: "normal", value: "正常" }
];

export const hAligns = [
  { id: "left", value: "左对齐" },
  { id: "center", value: "居中对齐" },
  { id: "right", value: "右对齐" }
];

export const vAligns = [
  { id: "top", value: "上对齐" },
  { id: "middle", value: "居中对齐" },
  { id: "bottom", value: "下对齐" }
];

export const writingModes = [
  { id: "horizontal-tb", value: "水平" },
  { id: "vertical-rl", value: "垂直" }
];

export const justifyContents = [
  { id: "flex-start", value: "左对齐" },
  { id: "center", value: "居中对齐" },
  { id: "flex-end", value: "右对齐" }
];

export const aligns = [
  { id: "flex-start", value: "上对齐" },
  { id: "center", value: "居中对齐" },
  { id: "flex-end", value: "下对齐" }
];

export const angles = [
  { id: "horizontal", value: "水平" },
  { id: "bevel", value: "斜角" },
  { id: "vertical", value: "垂直" }
];

export const titleLocations = [
  { id: "start", value: "开头" },
  { id: "center", value: "中间" },
  { id: "end", value: "末尾" }
];

export const lineStyles = [
  { id: "solid", value: "实线" },
  { id: "dashed", value: "虚线" }
];

export const buttonTypes=[
  { id: "default", value: "default" },
  { id: "primary", value: "primary" },
  { id: "info", value: "info" },
  { id: "success", value: "success" },
  { id: "warning", value: "warning" },
  { id: "error", value: "error" },
]

export const fillTypes = [
  { id: "solid", value: "实体填充" },
  { id: "gradient", value: "渐变填充" }
];

export const repeatTypes = [
  { id: "no-repeat", value: "不重复，拉伸满" },
  { id: "repeat", value: "水平和垂直重复" },
  { id: "repeat-x", value: "水平重复" },
  { id: "repeat-y", value: "垂直重复" }
];

export const echartsLablePositions = [
  { id: "top", value: "顶部" },
  { id: "left", value: "左侧" },
  { id: "right", value: "右侧" },
  { id: "bottom", value: "底部" },
  { id: "inside", value: "内部" },
  { id: "insideLeft", value: "内-左侧" },
  { id: "insideRight", value: "内-右侧" },
  { id: "insideTop", value: "内-顶部" },
  { id: "insideBottom", value: "内-底部" },
  { id: "insideTopLeft", value: "内-顶部居左" },
  { id: "insideBottomLeft", value: "内-底部居左" },
  { id: "insideTopRight", value: "内-顶部居右" },
  { id: "insideBottomRight", value: "内-顶部居右" }
];

export const animationEasings = Object.keys(AnimationEasing).map(m => ({ id: m, value: m }));

export const selectSuggests = [
  { id: "auto", value: "自适应" },
  { id: "dataMin", value: "数据最小值" },
  { id: "dataMax", value: "数据最大值" }
];

export const orients = [
  { id: "horizontal", value: "水平" },
  { id: "vertical", value: "垂直" }
];

export const axisTypes = [
  { id: "category", value: "类目型" },
  { id: "value", value: "数值型" },
  { id: "time", value: "时间型" }
];

export const legendLocations = [
  { id: "top-left", value: "顶部居左" },
  { id: "top-center", value: "顶部居中" },
  { id: "top-right", value: "顶部居右" },
  { id: "middle-left", value: "左侧居中" },
  { id: "middle-right", value: "右侧居中" },
  { id: "bottom-left", value: "底部居左" },
  { id: "bottom-center", value: "底部居中" },
  { id: "bottom-right", value: "底部居右" }
];

export const legendIcons = [
  { id: "auto", value: "自适应", icon: "shape-auto" },
  { id: "circle", value: "圆形", icon: "shape-circle" },
  { id: "rect", value: "矩形", icon: "shape-rect" },
  { id: "roundRect", value: "圆角矩形", icon: "shape-round-rect" },
  { id: "triangle", value: "三矩形", icon: "shape-triangle" },
  { id: "diamond", value: "菱形", icon: "shape-diamond" },
  { id: "arrow", value: "箭头", icon: "shape-arrow" },
  { id: "emptyCircle", value: "空心圆形", icon: "shape-circle" },
  { id: "emptyRect", value: "空心矩形", icon: "shape-rect" },
  { id: "emptyRoundRect", value: "空心圆角矩形", icon: "shape-round-rect" },
  { id: "emptyTriangle", value: "空心三角形", icon: "shape-triangle" },
  { id: "emptyDiamond", value: "空心菱形", icon: "shape-diamond" },
  { id: "emptyArrow", value: "空心箭头", icon: "shape-arrow" }
];

export const valueFormats = [
  { id: "auto", value: "默认" },
  { id: "d", value: "11(整数)" },
  { id: ".1f", value: "11.1(浮点数)" },
  { id: ".2f", value: "11.11(浮点数)" },
  { id: ".0%", value: "11%" },
  { id: ".1%", value: "11.1%" },
  { id: ".2%", value: "11.11%" },
  { id: "th", value: "1,111(千分位)" },
  { id: ".1t", value: "1,111.1(千分位)" },
  { id: ".2t", value: "1,111.11(千分位)" }
];

export const timeFormats = [
  { id: "YYYY-MM-DD HH:mm:ss", value: "2012-01-01 02:03:00(年-月-日 时:分:秒)" },
  { id: "YYYY-MM-DD", value: "2012-01-01(年-月-日)" },
  { id: "YYYY-MM", value: "2012-01(年-月)" },
  { id: "MM-DD", value: "01-01(月-日)" },
  { id: "YYYY", value: "2012(年)" },
  { id: "MM", value: "01(月)" },
  { id: "YYYY/MM/DD HH:mm:ss", value: "2012/01/01 02:03:00(年/月/日 时:分:秒)" },
  { id: "YYYY/MM/DD", value: "2012/01/01(年/月/日)" },
  { id: "YYYY/MM", value: "2012/01(年/月)" },
  { id: "MM/DD", value: "01/01(月/日)" }
];

export const imageTypes = [
  { id: "bitmap", value: "位图" },
  { id: "vector", value: "矢量图" }
];

export const refreshIconFamily = [
  { id: "images/RefreshCircleBlack.svg", value: "刷新图标-1" },
  { id: "images/RefreshCircleWhite.svg", value: "刷新图标-2" },
  { id: "images/RefreshDoubleCircleArrow.svg", value: "刷新图标-3" },
  { id: "images/RefreshSimple.svg", value: "刷新图标-4" },
  { id: "images/refresh.svg", value: "刷新图标-5" }
];

export const overflowFamily = [
  { id: "visible", value: "完整显示" },
  { id: "hidden", value: "隐藏" },
  { id: "scroll", value: "滚动条显示" }
];

export const fontWeightFamily = [
  { id: "normal", value: "正常" },
  { id: "bold", value: "加粗" }
];

export const borderStyleFamily = [
  { id: "solid", value: "实线" },
  { id: "dotted", value: "点状" },
  { id: "dashed", value: "虚线" },
  { id: "double", value: "双线" }
];

export const textAlignFamily = [
  { id: "center", value: "居中" },
  { id: "left", value: "左对齐" },
  { id: "right", value: "右对齐" }
];

export const closeIconFamily = [
  { id: "images/close-o.svg", value: "关闭图标-1" },
  { id: "images/CloseCircle.svg", value: "关闭图标-2" },
  { id: "images/CloseCircleOutline.svg", value: "关闭图标-3" },
  { id: "images/CloseOutline.svg", value: "关闭图标-4" }
];

export const carouselDirectionFamily = [
  { id: "up", value: "向上" },
  { id: "down", value: "向下" }
];

export const carouselLineTypeFamily = [
  { id: "solid", value: "实线" },
  { id: "dotted", value: "点线" },
  { id: "dashed", value: "虚线" },
  /*  { id: 'double', value: '双线' },*/
  { id: "none", value: "无边框" }
];

export const cursorFamily = [
  { id: "default", value: "默认" },
  { id: "auto", value: "浏览器自动" },
  { id: "crosshair", value: "十字线" },
  { id: "pointer", value: "指示链接的指针（一只手）" },
  { id: "move", value: "移动" },
  { id: "text", value: "I字型" },
  { id: "wait", value: "等待" },
  { id: "help", value: "帮助" },
  { id: "e-resize", value: "向右箭头" },
  { id: "ne-resize", value: "向右上箭头" },
  { id: "nw-resize", value: "向左上箭头" },
  { id: "n-resize", value: "向上箭头" },
  { id: "se-resize", value: "向右下箭头" },
  { id: "sw-resize", value: "向左下箭头" },
  { id: "w-resize", value: "向左箭头" },
  { id: "s-resize", value: "向下箭头" }
];

export const position = [
  { id: "static", value: "static" },
  { id: "fixed", value: "fixed" },
  { id: "relative", value: "relative" },
  { id: "absolute", value: "absolute" }
];

export const svgLineType = [
  { id: "None", value: "无" },
  { id: "Electricity", value: "电流" },
  { id: "Track", value: "轨迹" },
  { id: "CustomTrack", value: "自定义轨迹" },
  { id: "WaterDrop", value: "水珠" }
];

export const sizeFamily = [
  { id: "large", value: "大" },
  { id: "medium", value: "中" },
  { id: "small", value: "小" }
];

export const placementFamily = [
  { id: "top-start", value: "top-start" },
  { id: "top-end", value: "top-end" },
  { id: "right-start", value: "right-start" },
  { id: "right", value: "right" },
  { id: "right-end", value: "right-end" },
  { id: "bottom-start", value: "bottom-start" },
  { id: "bottom", value: "bottom" },
  { id: "bottom-end", value: "bottom-end" },
  { id: "left-start", value: "left-start" },
  { id: "left", value: "left" },
  { id: "left-end", value: "left-end" }
];

export const controlTypes = [
  { id: "input", value: "文本输入框" },
  { id: "number", value: "数字输入框" },
  { id: "select", value: "下拉框" },
  { id: "radio", value: "单选框" },
  { id: "checkbox", value: "复选框" },
  // { id: "date", value: "日期控件" }
  // { id: "time", value: "时间控件" }
];


export const shapeTypes = [
  { id: "rect", value: "矩形" },
  { id: "roundRect", value: "圆角矩形" },
  { id: "round", value: "圆形" },
  { id: "custom", value: "自定义" }
];

export const rotateDirection = [
  { id: "clockwise", value: "顺时针方向" },
  { id: "anticlockwise", value: "逆时针方向" }
];
