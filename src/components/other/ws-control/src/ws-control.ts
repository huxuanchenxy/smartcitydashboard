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
import { getWsUrl } from "@/utils/apiUrl";
export class WsControl extends DatavComponent {
  config = {
    // ws: "ws://" + import.meta.env.VITE_APP_WS_HOST + ":"+ import.meta.env.VITE_APP_WS_PORT + "/websocket",
    ws: getWsUrl('websocket'),
    retryCounts: 3, //重试次数
    retryTimeSpan: 5000, //重试间隔
    mode: "dev",
    uuid: true,
    ic: false
  };
  apis: Partial<ApiConfigMap>;
  apiData: Partial<ApiDataConfigMap>;
  events: Record<string, DataEventConfig>;
  actions: Record<string, DataEventConfig>;

  constructor() {
    super("WsControl", { w: 200, h: 50 });
    this.initData();
  }

  initData() {
    const fields = [createField("ws", { description: "websocket地址", optional: true })];

    this.apis = initApiConfig({
      fields: Object.assign({}, ...fields)
    });

    this.apiData = initApiData(this.id);

    this.events = {};

    this.actions = {};

    return this;
  }
  async loadData() {
    try {
      const path = "other/ws-control";
      const res = await getStaticData(this.id, path);
      this.apiData.source.config.data = JSON.stringify(res.data);
    } catch (error) {
      throw error;
    }
  }
}

export default WsControl;
