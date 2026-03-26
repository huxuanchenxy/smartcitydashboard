import { DatavComponent } from "@/components/datav-component";
import {
  ApiConfigMap,
  ApiDataConfigMap,
  initApiConfig,
  initApiData
} from "@/components/data-source";
import { createField } from "@/components/data-field";
import { DataEventConfig } from "@/components/data-event";
import { getStaticData } from "@/api/data";

/**
 * PgmEditor
 */
interface PgmEditorConfig {
  global: {
    fontFamily: string;
    canvasWidth: number;
    canvasHeight: number;
    zoomLevel: number;
    backgroundColor: string;
  };
  editor: {
    tool: string;
    brushSize: number;
    brushColor: number;
    brushShape: 'circle' | 'square';
    eraserSize: number;
  };
  ros: {
    enabled: boolean;
    wsUrl: string;
    poseTopic: string;
    goalService: string;
  };
  robot: {
    iconSize: number;
    iconColor: string;
    showDirection: boolean;
    showRobot: boolean;
  };
  goals: {
    points: Array<any>;
    showNames: boolean;
    pointSize: number;
    pointColor: string;
    goalUrlEnabled: boolean;
    goalUrl: string;
  };
  file: {
    format: string;
    maxValue: number;
    url: string;
  };
  cursor: string;
}

export class PgmEditor extends DatavComponent {
  config: PgmEditorConfig = {
    global: {
      fontFamily: "Microsoft Yahei",
      canvasWidth: 800,
      canvasHeight: 600,
      zoomLevel: 100,
      backgroundColor: "#f0f0f0"
    },
    editor: {
      tool: "brush", // brush, eraser
      brushSize: 5,
      brushColor: 128, // 0-255
      brushShape: "circle", // circle, square
      eraserSize: 5
    },
    ros: {
      enabled: false,
      wsUrl: "ws://localhost:9090",
      poseTopic: "/robot/pose",
      goalService: "/robot/set_goal"
    },
    robot: {
      showRobot: true,
      iconSize: 20,
      iconColor: "#ff0000",
      showDirection: true
    },
    goals: {
    points: [],
    showNames: true,
    pointSize: 10,
    pointColor: "#00ff00",
    goalUrlEnabled: false,
    goalUrl: ""
  },
    file: {
      format: "P5", // P2, P5
      maxValue: 255,
      url: "http://tc120874o.hn-bkt.clouddn.com/rtabmap_lidar.pgm?e=1773724811&token=2XwIfVigbQscYSI2d4_e0hDzyLR07dizAq9me8tb:DZFHyZriLmlEx1cgQRynm5m3Si8="
    },
    cursor: "default"
  };

  apis: Partial<ApiConfigMap>;
  apiData: Partial<ApiDataConfigMap>;

  events: Record<string, DataEventConfig>;

  actions: Record<string, DataEventConfig>;

  constructor() {
    super("PgmEditor", { w: 800, h: 600 });

    this.initData();
  }

  initData() {
    const fields = [
      createField("imageData", {
        description: "图像数据",
        optional: true
      }),
      createField("width", {
        description: "图像宽度"
      }),
      createField("height", {
        description: "图像高度"
      }),
      createField("maxValue", {
        description: "最大灰度值"
      }),
      createField("robotPose", {
        description: "机器人位置",
        optional: true
      }),
      createField("goalPoints", {
        description: "目标点位",
        optional: true
      })
    ];

    this.apis = initApiConfig({
      fields: Object.assign({}, ...fields),
      description: "PGM编辑器接口"
    });

    this.apiData = initApiData(this.id);

    this.events = {
      onFileLoaded: {
        description: "文件加载完成",
        fields: Object.assign({}, ...fields)
      },
      onImageModified: {
        description: "图像修改",
        fields: Object.assign({}, ...fields)
      },
      onFileSaved: {
        description: "文件保存",
        fields: Object.assign({}, ...fields)
      },
      onRobotMoved: {
        description: "机器人移动",
        fields: Object.assign({}, ...fields)
      }
    };

    this.actions = {};

    return this;
  }

  async loadData() {
    try {
      const path = "media/pgm-editor";
      const res = await getStaticData(this.id, path);
      this.apiData.source.config.data = JSON.stringify(res.data);
    } catch (error) {
      throw error;
    }
  }
}

export default PgmEditor;