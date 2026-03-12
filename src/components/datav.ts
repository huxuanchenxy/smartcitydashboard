import { kebabCase } from "@/utils/util";

export async function createComponent(name: string) {
  const path = kebabCase(name.substr(1));
  // console.log("pathpath", path, name.substr(1));
  switch (name.substr(1)) {
    // bar
    case "BasicBar": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "MultiBar": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BrokenLineBar": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "Waterfall": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "DrillDownBar": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // horizontal
    case "BasicHorizontal": {
      const comModule = await import(`./horizontal/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "StackHorizontal": {
      const comModule = await import(`./horizontal/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "NegativeHorizontal": {
      const comModule = await import(`./horizontal/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "Funnel": {
      const comModule = await import(`./horizontal/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // line
    case "BasicLine": {
      const comModule = await import(`./line/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // area
    case "BasicArea": {
      const comModule = await import(`./area/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "StackArea": {
      const comModule = await import(`./area/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "ArcBar": {
      const comModule = await import(`./line/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "MArcBar": {
      const comModule = await import(`./line/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // pie
    case "BasicPie": {
      const comModule = await import(`./pie/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "ProportionRing": {
      const comModule = await import(`./pie/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "DashboardPie": {
      const comModule = await import(`./pie/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // chart
    case "WordCloud": {
      const comModule = await import(`./chart/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // text
    case "MainTitle":
    case "Marquee":
    case "NumberTitleFlop":
    case "RangeNumberFlop":
    case "Paragraph":
    case "Timer":
    case "QuickText":
    case "FlexTextBox": {
      const comModule = await import(`./text/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // button
    case "Button":
    case "FullScreen":
    case "Switch":
    case "Slider": {
      const comModule = await import(`./button/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // input
    case "SearchBox": {
      const comModule = await import(`./text/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // dropDownList
    case "DropDownList": {
      const comModule = await import(`./select/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // media

    case "SvgLine":
    case "BgBox":
    case "BorderBox":
    case "Decoration":
    case "SvgReservoir":
    case "SvgBlower":
    case "MainImg": {
      const comModule = await import(`./media/${path}/src/${path}.ts`);
      return new comModule.default();
    }
    case "Video": {
      const comModule = await import(`./media/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // other
    case "DatePicker": {
      const comModule = await import(`./other/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "WsControl": {
      const comModule = await import(`./other/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "PmControl": {
      const comModule = await import(`./other/${path}/src/${path}.ts`);
      return new comModule.default();
    }
    // map
    case "OlMapWmts": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "GdMap": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BaiduMap": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "TecentMap": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BingMap": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "UeMap": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "City3dMap": {
      const cityPath = "city-3d-map";
      const comModule = await import(`./map/${cityPath}/src/${cityPath}.ts`);
      return new comModule.default();
    }

    case "Gd3dMap": {
      const gdPath = "gd-3d-map";
      const comModule = await import(`./map/${gdPath}/src/${gdPath}.ts`);
      return new comModule.default();
    }

    // iframe
    case "Iframe": {
      const comModule = await import(`./iframe/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    // bg-iframe
    case "BgIframe": {
      const comModule = await import(`./iframe/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "Group": {
      const comModule = await import(`./group/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BasicCarousel": {
      const comModule = await import(`./carousel/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "CarouselTable": {
      const comModule = await import(`./carousel/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "Table": {
      const comModule = await import(`./carousel/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "Progress": {
      const comModule = await import(`./line/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "WaterLevel": {
      const comModule = await import(`./chart/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "PunchCardScatter": {
      const comModule = await import(`./scatter/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "PolarBar": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "CartesianHeatmap": {
      const comModule = await import(`./heatmap/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BaiduapiMap": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BaiduwebglMap": {
      const comModule = await import(`./map/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BasicRadar": {
      const comModule = await import(`./radar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    //ic
    case "IcPanel": {
      const comModule = await import(`./ic/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "DynamicBar": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "DynamicSingleBar": {
      const comModule = await import(`./bar/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "DynamicLine": {
      const comModule = await import(`./line/${path}/src/${path}.ts`);
      return new comModule.default();
    }
    case "ThreedViewer": {
      const comModule = await import(`./media/${path}/src/${path}.ts`);
      return new comModule.default();
    }

    case "BasicForm": {
      const comModule = await import(`./form/${path}/src/${path}.ts`);
      return new comModule.default();
    }
    case "CustomerComp": {
      //console.log("CustomerComp……", `./customer/${path}/src/${path}.ts`);
      const comModule = await import(`./customer/${path}/src/${path}.ts`);
      
      return new comModule.default();
    }

    case "Excel": {
      const comModule = await import(`./office/${path}/src/${path}.ts`);
      return new comModule.default();
    }
    default:
      throw Error(`Unknown component type: ${name}.`);
  }
}
