import { DatavComponent } from "@/components/datav-component";
import { ApiConfigMap, ApiDataConfigMap } from "@/components/data-source";
import { DataEventConfig } from "@/components/data-event";
import { getStaticData } from "@/api/data";
import { generateUUID } from "@/utils/util";
import { PtModel } from "@/components/data-handle";

export class ThreedModelConfig {
  constructor() {
    this.id = generateUUID();
  }

  id: string | null = null;
  url: string | null = null;
  scale = {
    X: 1,
    Y: 1,
    Z: 1
  };
  postion = {
    X: 0,
    Y: 0,
    Z: 0
  };
  rotate = {
    X: 0,
    Y: 0,
    Z: 0
  };
  modelNodeMappings: modelNodeMapping[] = [];

  materials: MaterialConfig[] = [];

  meshList: { id: string | number; value: string | number }[] = [];
}

export class ThreedModelEventArgs {
  comId: String | null = null;
  config: ThreedModelConfig | null = null;
}

export class ThreedLightEventArgs {
  comId: String | null = null;
  config: LightConfig | null = null;
}

export enum ThreedModelEventType {
  AddThreedModelItem = "add-threed-model-item",
  RemoveThreedModelItem = "remove-threed-model-item",
  ModifyThreedModelUrlItem = "modify-threed-model-url-item",
  ModifyThreedModelParamItem = "modify-threed-model-param-item",

  AddThreedLightItem = "add-light-item",
  RemoveThreedLightItem = "remove-light-item",
  ModifyThreedLightItem = "modify-light-item",

  modifyAmbientLight = "modify-ambient-light",

  ModifyMaterial = "modify-material",

  ModifyBackground = "modify-background",

  ModifyFog = "modify-fog",

  ModifyGround = "modify-ground"
}

export enum LightType {
  DirectionalLight = "DirectionalLight", //平行光
  AmbientLight = "AmbientLight" //氛围光
}

export interface MaterialConfig {
  //parent:ThreedModelConfig
  meshName: string | null;
  color: string | null;
  opacity: number;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export enum BackgroundType {
  none = "none",
  Color = "Color",
  Texture = "Texture",
  Day = "Day",
  Night = "Night"
}

export interface modelNodeMapping {
  deviceCode: string | null;
  nodeCode: string | null;
  modelKey: string | null;
  nodeType: string | null;
  operator1: string | null;
  value1: string | null;
  operator2: string | null;
  value2: string | null;
  pt: PtModel | null;
  loop: boolean | null;
  boneData: any[];
}

export class LightConfig {
  constructor() {
    this.id = generateUUID();
  }

  static createBy = (
    color: string,
    intensity: number,
    lightType: LightType,
    x: number,
    y: number,
    z: number
  ) => {
    const config = new LightConfig();
    config.color = color;
    config.intensity = intensity;
    config.lightType = lightType;
    config.x = x;
    config.y = y;
    config.z = z;
    return config;
  };

  id: string | null;
  color: string | null;
  intensity: number | null;
  lightType: LightType | null;
  x: number | null;
  y: number | null;
  z: number | null;
}

export interface AmbientLightConfig {
  color: string;
  intensity: number;
}

export interface FogConfig {
  enabled: boolean;
  color: string;
  near: number;
  far: number;
}

export interface cameraStop {
  x: number;
  y: number;
  z: number;
  groupId: number | null;
}

export interface BackgroundConfig {
  type: BackgroundType;
  color: string;
  pic1: string;
  pic2: string;
  pic3: string;
  pic4: string;
  pic5: string;
  pic6: string;
}

export interface GroundConfig {
  enabled: boolean;
  width: number;
  height: number;
  color: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

// export class BackgroundEventArgs {
//   comId: String | null = null;
//   config: BackgroundConfig | null = null;
// }


export interface mapPointSetting {
  name: string
  type: string
  apiUrl: string
  iconUrl: string
  params?: any
  iconWidth: number
  iconHeight: number
  dataJson: string
}

export class ThreedViewer extends DatavComponent {
  config = {
    transform: "none", //"translate", "rotate", "scale",
    scene: {
      ambientLight: {
        color: "rgb(64,64,64)",
        intensity: 1
      },
      background: {
        type: BackgroundType.none as BackgroundType,
        color: "rgb(124,191,255)",
        pic1: "",
        pic2: "",
        pic3: "",
        pic4: "",
        pic5: "",
        pic6: ""
      },
      ground: {
        enabled: false,
        width: 10000,
        height: 10000,
        color: "rgb(255,255,255)",
        position: {
          x: 0,
          y: 0,
          z: 0
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        }
      },
      fog: {
        enabled: false,
        color: "rgb(255,255,255)",
        near: 0,
        far: 4000
      }
    },
    render: {
      antialias: true,
      pixelRatio: 1
    },
    camera: {
      position: {
        x: -8,
        y: -26,
        z: 0
      },
      lookAt: {
        x: 0,
        y: 0,
        z: 0
      },
      light: {
        color: "rgba(255,255,255,1)",
        intensity: 2
      },
      fov: 50,
      //aspect: 1,
      near: 0.1,
      far: 20000
    },
    models: [new ThreedModelConfig()],
    select: {
      enable: false,
      color: "rgba(255,0,0,1)"
    },
    light: new Array<LightConfig>(),
    cameraStops: [],
    pointConfigs: [] as mapPointSetting[],
    // pointConfigs: [
    //   {
    //     name: '',
    //     type: '',
    //     apiUrl: '',
    //     iconUrl: '',
    //     iconWidth: 0,
    //     iconHeight: 0,
    //     dataJson: '',
    //   },
    // ],
    loopPlay: false,
    autoPlay: false,
    CruisingAltitude: 0 //巡航高度
  };

  apis: Partial<ApiConfigMap>;
  apiData: Partial<ApiDataConfigMap>;

  events: Record<string, DataEventConfig>;

  actions: Record<string, DataEventConfig>;

  constructor() {
    super("ThreedViewer", { w: 200, h: 200 });
    this.initData();
  }

  initData() {
    this.apis = {};
    this.apiData = {};
    this.events = {};
    this.actions = {};

    // this.ichandles = {
    //   nodeValueChange : {
    //     eventName: 'nodeValueChange',
    //     fields: [],
    //     //events: [ { methodCode: 'nodeValueChange', methodName: '节点值改变' } ],
    //   },
    // }

    // this.ichandles['nodeValueChange'] =  {
    //   eventName: 'nodeValueChange',
    //   fields: [],
    // }

    return this;
  }

  async loadData() {
    try {
      // 组件静态数据来源，当前项目统一管理目录：data/*
      // 如：data/demo/data.json 简写为 => demo/data
      const path = "";
      const res = await getStaticData(this.id, path);
      this.apiData.source.config.data = JSON.stringify(res.data);
    } catch (error) {
      throw error;
    }
  }
}

export default ThreedViewer;
