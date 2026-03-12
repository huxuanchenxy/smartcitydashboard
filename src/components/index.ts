import type { App } from 'vue'
import VMainTitle from './text/main-title'
import VMarquee from './text/marquee'
import VNumberTitleFlop from './text/number-title-flop'
import VParagraph from './text/paragraph'
import VTimer from './text/timer'

import VDatePicker from './other/date-picker'

import VBgBox from './media/bg-box'
import VBorderBox from './media/border-box'
import VDecoration from './media/decoration'
import VMainImg from './media/main-img'

import VBasicBar from './bar/basic-bar'
import VBrokenLineBar from './bar/broken-line-bar'
import VDrillDownBar from './bar/drill-down-bar'
import VMultiBar from './bar/multi-bar'
import VWaterfall from './bar/waterfall'

import VNegativeHorizontal from './horizontal/negative-horizontal'

import VHorizontal from './horizontal/basic-horizontal'
import VStackHorizontal from './horizontal/stack-horizontal'

import VBasicLine from './line/basic-line'

import VBasicArea from './area/basic-area'
import VStackArea from './area/stack-area'

import VBasicPie from './pie/basic-pie'

import VProportionRing from './pie/proportion-ring'

import VDashboardPie from './pie/dashboard-pie'

import VArcBar from './line/arc-bar'

import VMArcBar from './line/m-arc-bar'

import VFullScreen from './button/full-screen'

import VSearchBox from './text/search-box'


import VWordCloud from './chart/word-cloud'

import VGdMap from './map/gd-map'
import VOlMapWmts from './map/ol-map-wmts'
import VUeMap from './map/ue-map'

import VBgIframe from './iframe/bg-iframe'
import VIframe from './iframe/iframe'

import VDropDownList from './select/drop-down-list'

import VBasicCarousel from './carousel/basic-carousel'
import VCarouselTable from './carousel/carousel-table'
import VGroup from './group/group'

import VButton from './button/button'
import VFunnel from './horizontal/funnel'
import VProgress from './line/progress'
import VQuickText from './text/quick-text'

import VBaiduMap from './map/baidu-map'
import VBingMap from './map/bing-map'
import VTecentMap from './map/tecent-map'

import VCity3dMap from './map/city-3d-map'
import VGd3dMap from './map/gd-3d-map'

import VVideo from './media/video'

import VFlexTextBox from './text/flex-text-box'

import VWaterLevel from './chart/water-level'

import VPunchCardScatter from './scatter/punch-card-scatter'

import VPolarBar from './bar/polar-bar'

import VCartesianHeatmap from './heatmap/cartesian-heatmap'

import VSwitch from './button/switch'
import VBaiduapiMap from './map/baiduapi-map'
import VBaiduwebglMap from './map/baiduwebgl-map'
import VSvgBlower from './media/svg-blower'
import VSvgLine from './media/svg-line'
import VSvgReservoir from './media/svg-reservoir'
import VBasicRadar from './radar/basic-radar'

import VWsControl from './other/ws-control'

import VSlider from './button/slider'

import VPmControl from './other/pm-control'

import VIcPanel from './ic/ic-panel'

import VDynamicBar from './bar/dynamic-bar'

import VDynamicSingleBar from './bar/dynamic-single-bar'

import VDynamicLine from './line/dynamic-line'

import VThreedViewer from './media/threed-viewer'

import VCustomerComp from './customer/customer-comp'
import VExcel from './office/excel'
import VBasicForm from './form/basic-form'
import VRangeNumberFlop from './text/range-number-flop'
const components = [
  VCustomerComp,
  VExcel,
  VRangeNumberFlop,
  VMainTitle,
  VNumberTitleFlop,
  VDatePicker,
  VBgBox,
  VBorderBox,
  VDecoration,
  VBasicBar,
  VMultiBar,
  VBrokenLineBar,
  VWaterfall,
  VHorizontal,
  VStackHorizontal,
  VBasicLine,
  VBasicArea,
  VStackArea,
  VProportionRing,
  VBasicLine,
  VBasicPie,
  VMarquee,
  VParagraph,
  VTimer,
  VFullScreen,
  VMainImg,
  VWordCloud,
  VOlMapWmts,
  VUeMap,
  VIframe,
  VBgIframe,
  VArcBar,
  VMArcBar,
  VDashboardPie,
  VSearchBox,
  VDropDownList,
  VGroup,
  VBasicCarousel,
  VCarouselTable,
  VButton,
  VFunnel,
  VDrillDownBar,
  VQuickText,
  VGdMap,
  VProgress,
  VBaiduMap,
  VBingMap,
  VTecentMap,
  VCity3dMap,
  VVideo,
  VFlexTextBox,
  VWaterLevel,
  VPunchCardScatter,
  VPolarBar,
  VCartesianHeatmap,
  VGd3dMap,
  VSvgLine,
  VSwitch,
  VNegativeHorizontal,
  VBaiduapiMap,
  VBaiduwebglMap,
  VGd3dMap,
  VBasicRadar,
  VWsControl,
  VSlider,
  VPmControl,
  VIcPanel,
  VDynamicBar,
  VDynamicSingleBar,
  VDynamicLine,
  VThreedViewer,
  VBasicForm,
  VSvgReservoir,
  VSvgBlower
]

const install = (app: App): void => {
  components.forEach(component => {
    app.use(component)
  })
}

export default {
  install,
}
