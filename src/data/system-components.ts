const imagePath = "images/大图/";
const thumPath = "images/缩略图/";

export const bar = {
  type: "bar",
  name: "柱状图",
  icon: "v-icon-chart-bar",
  data: [
    {
      name: "VBasicBar",
      alias: "柱状图",
      img: `${imagePath}柱状图.png`,
      thum: `${thumPath}柱状图.png`,
      used: true,
      visible: true
    },
    {
      name: "VMultiBar",
      alias: "垂直分组柱状图",
      img: `${imagePath}垂直分组柱状图.png`,
      thum: `${thumPath}垂直分组柱状图.png`,
      used: true,
      visible: true
    },
    {
      name: "VArcBar",
      alias: "玉环图",
      img: `${imagePath}玉环图.png`,
      thum: `${thumPath}玉环图.png`,
      used: true,
      visible: true
    },
    {
      name: "VMArcBar",
      alias: "多维环图",
      img: `${imagePath}多维环图.png`,
      thum: `${thumPath}多维环图.png`,
      used: true,
      visible: true
    },
    {
      name: "VBrokenLineBar",
      alias: "折线柱图",
      img: `${imagePath}折线柱图.png`,
      thum: `${thumPath}折线柱图.png`,
      used: true,
      visible: true
    },
    {
      name: "VWaterfall",
      alias: "瀑布图",
      img: `${imagePath}瀑布图.png`,
      thum: `${thumPath}瀑布图.png`,
      used: true,
      visible: true
    },
    {
      name: "VDrillDownBar",
      alias: "钻取柱图",
      img: `${imagePath}柱状图.png`,
      thum: `${thumPath}柱状图.png`,
      used: true,
      visible: true
    },
    {
      name: "VPolarBar",
      alias: "极坐标柱状图",
      img: `${imagePath}极坐标柱状图.png`,
      thum: `${thumPath}极坐标柱状图.png`,
      used: true,
      visible: true
    },
    {
      name: "VDynamicBar",
      alias: "动态分组柱状图",
      img: `${imagePath}垂直分组柱状图.png`,
      thum: `${thumPath}垂直分组柱状图.png`,
      used: true,
      visible: true
    },
    {
      name: "VDynamicSingleBar",
      alias: "动态柱状图",
      img: `${imagePath}柱状图.png`,
      thum: `${thumPath}柱状图.png`,
      used: true,
      visible: true
    }
  ]
};

export const horizontalBar = {
  type: "horizontal",
  name: "条形图",
  icon: "v-icon-chart-bar",
  data: [
    {
      name: "VBasicHorizontal",
      alias: "基本条形图",
      img: `${imagePath}基本条形图.png`,
      thum: `${thumPath}基本条形图.png`,
      used: true,
      visible: true
    },
    {
      name: "VStackHorizontal",
      alias: "堆叠条形图",
      img: `${imagePath}堆叠条形图.png`,
      thum: `${thumPath}堆叠条形图.png`,
      used: true,
      visible: true
    },
    {
      name: "VNegativeHorizontal",
      alias: "正负条形图",
      img: `${imagePath}正负条形图.png`,
      thum: `${thumPath}正负条形图.png`,
      used: true,
      visible: true
    },
    {
      name: "VFunnel",
      alias: "漏斗图",
      img: `${imagePath}漏斗图.png`,
      thum: `${thumPath}漏斗图.png`,
      used: true,
      visible: true
    }
  ]
};

export const line = {
  type: "line",
  name: "折线图",
  icon: "v-icon-chart-line",
  data: [
    {
      name: "VBasicLine",
      alias: "基本折线图",
      img: `${imagePath}基本折线图.png`,
      thum: `${thumPath}基本折线图.png`,
      used: true,
      visible: true
    },
    {
      name: "VDynamicLine",
      alias: "动态折线图",
      img: `${imagePath}基本折线图.png`,
      thum: `${thumPath}基本折线图.png`,
      used: true,
      visible: true
    }
  ]
};

export const area = {
  type: "area",
  name: "区域图",
  icon: "v-icon-chart-line",
  data: [
    {
      name: "VBasicArea",
      alias: "区域图",
      img: `${imagePath}区域图.png`,
      thum: `${thumPath}区域图.png`,
      used: true,
      visible: true
    },
    {
      name: "VStackArea",
      alias: "堆叠区域图",
      img: `${imagePath}堆叠区域图.png`,
      thum: `${thumPath}堆叠区域图.png`,
      used: true,
      visible: true
    }
  ]
};

export const pie = {
  type: "pie",
  name: "饼环图",
  icon: "v-icon-chart-pie",
  data: [
    {
      name: "VBasicPie",
      alias: "基本饼图",
      img: `${imagePath}基本饼图.png`,
      thum: `${thumPath}基本饼图.png`,
      used: true,
      visible: true
    },
    {
      name: "VProportionRing",
      alias: "指标占比饼图",
      img: `${imagePath}指标占比饼图.png`,
      thum: `${thumPath}指标占比饼图.png`,
      used: true,
      visible: true
    },
    {
      name: "VDashboardPie",
      alias: "仪表饼图",
      img: `${imagePath}仪表饼图.png`,
      thum: `${thumPath}仪表饼图.png`,
      used: true,
      visible: true
    }
  ]
};

export const scatter = {
  type: "scatter",
  name: "散点图",
  icon: "v-icon-chart-scatter",
  data: [
    {
      name: "VPunchCardScatter",
      alias: "打卡气泡图",
      img: `${imagePath}打卡气泡图.png`,
      thum: `${thumPath}打卡气泡图.png`,
      used: true,
      visible: true
    }
  ]
};

export const radar = {
  type: "radar",
  name: "雷达图",
  icon: "v-icon-chart-radar",
  data: [
    {
      name: "VBasicRadar",
      alias: "雷达图",
      img: `${imagePath}雷达图.png`,
      thum: `${thumPath}雷达图.png`,
      used: true,
      visible: true
    }
  ]
};

export const heatmap = {
  type: "heatmap",
  name: "热力图",
  icon: "v-icon-chart-heatmap",
  data: [
    {
      name: "VCartesianHeatmap",
      alias: "笛卡尔热力图",
      img: `${imagePath}笛卡尔热力图.png`,
      thum: `${thumPath}笛卡尔热力图.png`,
      used: true,
      visible: true
    }
  ]
};

// export const relation = {
//   type: 'relation',
//   name: '关系图',
//   icon: 'v-icon-relation',
//   data: [
//     {
//       name: 'VTree',
//       alias: '树图',
//       img: `data/originPic/tree.png`,
//       thum: `data/originPic/tree.png`,
//       used: false,
//       visible: true,
//     },
//   ],
// }

export const chart = {
  type: "chart",
  name: "其他",
  icon: "v-icon-other",
  data: [
    {
      name: "VWordCloud",
      alias: "词云",
      img: `${imagePath}词云.png`,
      thum: `${thumPath}词云.png`,
      used: true,
      visible: true
    },
    {
      name: "VWaterLevel",
      alias: "水位图",
      img: `${imagePath}水位图.png`,
      thum: `${thumPath}水位图.png`,
      used: true,
      visible: true
    }
  ]
};

export const map = {
  type: "map",
  name: "地图",
  icon: "v-icon-map",
  data: [
    {
      name: "VChina2d",
      alias: "基础平面地图",
      img: `data/originPic/2d-china-332-144.png`,
      thum: `data/originPic/2d-china-368-208.png`,
      used: false,
      visible: false,
      children: [
        {
          name: "VChina2dBubbles",
          alias: "呼吸气泡层",
          img: `data/originPic/2d-china-bubbles-180-180.png`,
          thum: `data/originPic/2d-china-bubbles-180-180.png`,
          used: false,
          visible: true
        },
        {
          name: "VChina2dFlyLines",
          alias: "飞线层",
          img: `data/originPic/2d-china-fly-lines-180-180.png`,
          thum: `data/originPic/2d-china-fly-lines-180-180.png`,
          used: false,
          visible: true
        }
      ]
    },
    {
      name: "VWorld3d",
      alias: "3D平面世界地图",
      img: `data/originPic/3d-world-332-144.png`,
      thum: `data/originPic/3d-world-368-208.png`,
      used: false,
      visible: false
    },
    {
      name: "VOlMapWmts",
      alias: "地图瓦片服务",
      img: `${imagePath}瓦片WMTS.png`,
      thum: `${imagePath}瓦片WMTS.png`,
      used: true,
      visible: true
    },
    {
      name: "VGdMap",
      alias: "高德地图",
      img: `${imagePath}高德地图.png`,
      thum: `${imagePath}高德地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VGd3dMap",
      alias: "高德3D地图",
      img: `${imagePath}高德地图.png`,
      thum: `${imagePath}高德地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VUeMap",
      alias: "飘视底图通讯模块",
      img: `${imagePath}飘视地图.png`,
      thum: `${imagePath}飘视地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VBaiduMap",
      alias: "百度地图",
      img: `${imagePath}百度地图.png`,
      thum: `${imagePath}百度地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VBaiduapiMap",
      alias: "百度api地图",
      img: `${imagePath}百度地图.png`,
      thum: `${imagePath}百度地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VBaiduwebglMap",
      alias: "百度WebGL地图",
      img: `${imagePath}百度地图.png`,
      thum: `${imagePath}百度地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VBingMap",
      alias: "Bing地图",
      img: `${imagePath}Bing地图.png`,
      thum: `${imagePath}Bing地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VTecentMap",
      alias: "腾讯地图",
      img: `${imagePath}腾讯地图.png`,
      thum: `${imagePath}腾讯地图.png`,
      used: true,
      visible: true
    },
    {
      name: "VCity3dMap",
      alias: "城地3D地图",
      img: `${imagePath}城地3D.png`,
      thum: `${imagePath}城地3D.png`,
      used: true,
      visible: true
    }
  ]
};

export const title = {
  type: "title",
  name: "标题",
  icon: "v-icon-title",
  data: [
    {
      name: "VMainTitle",
      alias: "通用标题",
      img: `${imagePath}通用标题.png`,
      thum: `${thumPath}通用标题.png`,
      used: true,
      visible: true
    },
    {
      name: "VMarquee",
      alias: "跑马灯",
      img: `${imagePath}跑马灯.png`,
      thum: `${thumPath}跑马灯.png`,
      used: true,
      visible: true
    },
    {
      name: "VNumberTitleFlop",
      alias: "数字翻牌器",
      img: `${imagePath}数字翻牌器.png`,
      thum: `${thumPath}数字翻牌器.png`,
      used: true,
      visible: true
    },
    {
      name: "VRangeNumberFlop",
      alias: "范围数字翻牌器",
      img: `${imagePath}数字翻牌器.png`,
      thum: `${thumPath}数字翻牌器.png`,
      used: true,
      visible: true
    },
    {
      name: "VParagraph",
      alias: "多行文本",
      img: `${imagePath}多行文本.png`,
      thum: `${thumPath}多行文本.png`,
      used: true,
      visible: true
    },
    {
      name: "VTimer",
      alias: "时间器",
      img: `${imagePath}时间器.png`,
      thum: `${thumPath}时间器.png`,
      used: true,
      visible: true
    },
    {
      name: "VQuickText",
      alias: "快速文本",
      img: `${imagePath}通用标题.png`,
      thum: `${thumPath}通用标题.png`,
      used: true,
      visible: true
    },
    {
      name: "VFlexTextBox",
      alias: "Flex文本容器",
      img: `${imagePath}多行文本.png`,
      thum: `${thumPath}多行文本.png`,
      used: true,
      visible: true
    }
  ]
};

export const list = {
  type: "list",
  name: "列表",
  icon: "v-icon-view-list",
  data: [
    // {
    //   name: 'VCarouselTable',
    //   alias: '轮播列表',
    //   img: `data/originPic/carousel-table-332-144.png`,
    //   thum: `data/originPic/carousel-table-370-208.png`,
    //   used: false,
    //   visible: true,
    // }, {
    //   name: 'VTableBar',
    //   alias: '轮播列表柱状图',
    //   img: `data/originPic/table-bar-332-144.png`,
    //   thum: `data/originPic/table-bar-370-208.png`,
    //   used: false,
    //   visible: true,
    // },
  ]
};

export const button = {
  type: "button",
  name: "按钮类",
  icon: "v-icon-interact",
  data: [
    {
      name: "VFullScreen",
      alias: "全屏切换",
      img: `${imagePath}全屏切换.png`,
      thum: `${thumPath}全屏切换.png`,
      used: true,
      visible: true
    },
    {
      name: "VButton",
      alias: "按钮",
      img: `${imagePath}按钮.png`,
      thum: `${thumPath}按钮.png`,
      used: true,
      visible: true
    },
    {
      name: "VSwitch",
      alias: "开关",
      img: `${imagePath}开关.png`,
      thum: `${thumPath}开关.png`,
      used: true,
      visible: true
    },
    {
      name: "VSlider",
      alias: "滑动选择",
      img: `${imagePath}滑动选择.png`,
      thum: `${thumPath}滑动选择.png`,
      used: true,
      visible: true
    }
  ]
};

export const input = {
  type: "input",
  name: "输入类",
  icon: "v-icon-interact",
  data: [
    {
      name: "VSearchBox",
      alias: "查询框",
      img: `${imagePath}查询框.png`,
      thum: `${thumPath}查询框.png`,
      used: true,
      visible: true
    }
  ]
};

export const select = {
  type: "select",
  name: "选择类",
  icon: "v-icon-interact",
  data: [
    {
      name: "VTabList",
      alias: "Tab列表",
      img: `data/originPic/tab-list-332-144.png`,
      thum: `data/originPic/tab-list-368-208.png`,
      used: false,
      visible: false
    },
    {
      name: "VDropDownList",
      alias: "选择框",
      img: `${imagePath}选择框.png`,
      thum: `${thumPath}选择框.png`,
      used: true,
      visible: true
    }
  ]
};

export const interactData = {
  type: "interact-data",
  name: "数据类",
  icon: "v-icon-interact",
  data: [
    {
      name: "VProgress",
      alias: "进度条",
      img: `${imagePath}进度条.png`,
      thum: `${imagePath}进度条.png`,
      used: true,
      visible: true
    }
  ]
};

export const material = {
  type: "material",
  name: "素材",
  //icon: 'v-icon-material',
  icon: "v-icon-media",
  data: [
    {
      name: "VBgBox",
      alias: "自定义背景块",
      img: `${imagePath}自定义背景块.png`,
      thum: `${thumPath}自定义背景块.png`,
      used: true,
      visible: true
    },
    {
      name: "VBorderBox",
      alias: "边框",
      img: `${imagePath}边框.png`,
      thum: `${thumPath}边框.png`,
      used: true,
      visible: true
    },
    {
      name: "VDecoration",
      alias: "装饰",
      img: `${imagePath}装饰.png`,
      thum: `${thumPath}装饰.png`,
      used: true,
      visible: true
    },
    {
      name: "VMainImg",
      alias: "单张图片",
      img: `${imagePath}单张图片.png`,
      thum: `${thumPath}单张图片.png`,
      used: true,
      visible: true
    },
    {
      name: "VSvgLine",
      alias: "SVG连接线",
      img: `${imagePath}SVG连接线.png`,
      thum: `${thumPath}SVG连接线.png`,
      used: true,
      visible: true
    },
    {
      name: "VSvgReservoir",
      alias: "SVG蓄水池",
      img: `${imagePath}SVG连接线.png`,
      thum: `${thumPath}SVG连接线.png`,
      used: true,
      visible: true
    },
    {
      name: "VSvgBlower",
      alias: "SVG鼓风机",
      img: `${imagePath}SVG连接线.png`,
      thum: `${thumPath}SVG连接线.png`,
      used: true,
      visible: true
    },
    {
      name: "VVideo",
      alias: "视频播放",
      img: `${imagePath}视频播放.png`,
      thum: `${thumPath}视频播放.png`,
      used: true,
      visible: true
    },
    {
      name: "VThreedViewer",
      alias: "3D视图",
      img: `${imagePath}threedViewer.png`,
      thum: `${thumPath}threedViewer.png`,
      used: true,
      visible: true
    },
    {
      name: "VPgmEditor",
      alias: "PGM编辑器",
      img: `${imagePath}threedViewer.png`,
      thum: `${thumPath}threedViewer.png`,
      used: true,
      visible: true
    }
  ]
};

export const other = {
  type: "other",
  name: "其他",
  icon: "v-icon-other",
  data: [
    {
      name: "VDatePicker",
      alias: "日期选择器",
      img: `data/originPic/date-picker.jpg`,
      thum: `data/originPic/time-selector.jpg`,
      used: true,
      visible: true
    },
    {
      name: "VGroup",
      alias: "组",
      img: `${imagePath}成组.png`,
      thum: `${thumPath}成组.png`,
      used: true,
      visible: false
    },
    {
      name: "VWsControl",
      alias: "通讯组件",
      img: `${imagePath}websocket.png`,
      thum: `${thumPath}websocket.png`,
      used: true,
      visible: true
    },
    {
      name: "VPmControl",
      alias: "窗体通讯",
      img: `${imagePath}postmessage.png`,
      thum: `${thumPath}postmessage.png`,
      used: true,
      visible: true
    }
  ]
};

export const carousel = {
  type: "carousel",
  name: "表格",
  icon: "v-icon-other",
  data: [
    {
      name: "VBasicForm",
      alias: "表单",
      img: `${imagePath}基础表单.png`,
      thum: `${thumPath}基础表单.png`,
      used: true,
      visible: true
    },
    {
      name: "VBasicCarousel",
      alias: "滚动表格",
      img: `${imagePath}滚动表格.png`,
      thum: `${thumPath}滚动表格.png`,
      used: true,
      visible: true
    },
    {
      name: "VCarouselTable",
      alias: "轮播表",
      img: `${imagePath}滚动表格.png`,
      thum: `${thumPath}滚动表格.png`,
      used: true,
      visible: true
    },
    {
      name: "VTable",
      alias: "轮播表",
      img: `${imagePath}滚动表格.png`,
      thum: `${thumPath}滚动表格.png`,
      used: false,
      visible: false
    }
  ]
};
const getCustomerDict = () => {
  const files = import.meta.glob("/public/pages/**/*");
  // console.log(files, Object.keys(files));
  let filesKey = Object.keys(files);
  let datas = [];
  filesKey.forEach(el => {
    let tempArray = el.split("/");
    let alias = tempArray[3];
    let filePath = `./pages/${alias}/index.html`;
    let existIndex = datas.findIndex(x => x.filePath == filePath);
    // console.log(datas, filePath, datas.includes(filePath));
    if (existIndex == -1) {
      // console.log("tempArray", filePath);
      datas.push({
        name: "VCustomerComp",
        alias,
        img: `${imagePath}kfzj.svg`,
        thum: `${thumPath}kfzj.svg`,
        used: true,
        visible: true,
        filePath
      });
    }
  });
  // console.log("datas^*……", datas);
  return datas;
};

// getCustomerDict();
export const customerComp = {
  type: "customer",
  name: "自定义组件",
  icon: "v-icon-other",
  data: [...getCustomerDict()]
};
// {
//   name: "VCustomerComp",
//   alias: "自定义组件2",
//   img: `${imagePath}kfzj.svg`,
//   thum: `${thumPath}kfzj.svg`,
//   used: true,
//   visible: true
// }
export const iframe = {
  type: "iframe",
  name: "内联框架",
  icon: "v-icon-other",
  data: [
    {
      name: "VIframe",
      alias: "iframe",
      img: `${imagePath}iframe.png`,
      thum: `${thumPath}iframe.png`,
      used: true,
      visible: true
    },
    {
      name: "VBgIframe",
      alias: "iframe背景",
      img: `${imagePath}iframe.png`,
      thum: `${thumPath}iframe.png`,
      used: true,
      visible: true
    }
    ,
    {
      name: "VAiIframe",
      alias: "Aiiframe",
      img: `${imagePath}iframe.png`,
      thum: `${thumPath}iframe.png`,
      used: true,
      visible: true
    }
  ]
};

export const ic = {
  type: "ic",
  name: "点位",
  icon: "v-icon-other",
  data: [
    {
      name: "VIcPanel",
      alias: "点位信息",
      img: `${imagePath}icpanel.png`,
      thum: `${thumPath}icpanel.png`,
      used: true,
      visible: true
    }
  ]
};

export const office = {
  type: "office",
  name: "办公",
  icon: "v-icon-other",
  data: [
    {
      name: "VExcel",
      alias: "Excel表格",
      img: `${imagePath}icpanel.png`,
      thum: `${thumPath}icpanel.png`,
      used: true,
      visible: true
    }
  ]
};

export const classifications = [
  {
    type: "customer",
    name: "自定义组件",
    icon: "v-icon-customer",
    data: [customerComp] // relation,
  },
    {
    type: "office",
    name: "办公软件",
    icon: "v-icon-customer",
    data: [office] // relation,
  },
  {
    type: "regular",
    name: "图表",
    icon: "v-icon-chart",
    data: [bar, horizontalBar, line, area, pie, radar, scatter, heatmap, chart] // relation,
  },
  {
    type: "iframe",
    name: "iframe",
    icon: "v-icon-other",
    data: [iframe]
  },
  // {
  //   type: 'carousel',
  //   name: '滚动表格',
  //   icon: 'v-icon-other',
  //   data: [carousel],
  // },
  {
    type: "map",
    name: "地图",
    icon: "v-icon-map",
    data: [map]
  },
  {
    type: "text",
    name: "信息",
    icon: "v-icon-com-info",
    data: [title]
  },
  {
    type: "table",
    name: "表格",
    icon: "v-icon-table",
    data: [carousel]
  },
  {
    type: "interact",
    name: "控件",
    icon: "v-icon-interact",
    data: [button, select, interactData, input]
  },
  {
    type: "media",
    name: "媒体",
    icon: "v-icon-media",
    data: [material]
  },
  {
    type: "ic",
    name: "工控",
    icon: "v-icon-material",
    data: [ic]
  },

  {
    type: "other",
    name: "其他",
    icon: "v-icon-other",
    data: [other]
  }
];

export function findComByName(name: string) {
  for (let i = 0; i < classifications.length; i++) {
    const classification = classifications[i];
    for (let j = 0; j < classification.data.length; j++) {
      const category = classification.data[j];
      const com = category.data.find(m => m.name === name);
      if (com) {
        return {
          classification,
          category,
          com
        };
      }
    }
  }

  return null;
}
