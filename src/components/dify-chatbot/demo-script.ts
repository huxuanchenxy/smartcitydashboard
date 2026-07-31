export interface DemoScriptRule {
  keywords: string[];
  response: string;
  nextState?: string;
}

export interface DemoScriptState {
  name: string;
  rules: DemoScriptRule[];
  defaultResponse: string;
}

export interface DemoScript {
  initialState: string;
  states: Record<string, DemoScriptState>;
}

export const demoScript: DemoScript = {
  initialState: 'welcome',
  states: {
    welcome: {
      name: '欢迎',
      rules: [
        {
          keywords: ['项目经理', 'project manager', 'pm'],
          response: '您好！欢迎使用AI智能助手。作为项目经理，您可以上传设备文件、点位文件和图例文件来构建知识库。',
          nextState: 'project_manager'
        },
        {
          keywords: ['开发人员', 'developer', 'dev'],
          response: '您好！欢迎使用AI智能助手。作为开发人员，您可以上传图纸进行设备识别、点位绑定和界面生成。',
          nextState: 'developer'
        },
        {
          keywords: ['使用人员', 'user', '运维'],
          response: '您好！欢迎使用AI智能助手。作为使用人员，您可以查询运维信息，与组态画面交互。',
          nextState: 'user'
        },
        {
          keywords: ['登录', 'login'],
          response: '请选择您的角色：项目经理 / 开发人员 / 使用人员',
          nextState: 'welcome'
        }
      ],
      defaultResponse: '您好！欢迎使用AI智能助手。请告诉我您的角色：项目经理、开发人员或使用人员？'
    },

    project_manager: {
      name: '项目经理',
      rules: [
        {
          keywords: ['我上传了设备信息文件，请按设备编码字段从文件中结构化抽取设备数据，并检查字段完整性、格式正确性与重复项，明确标记缺失或异常的数据行', '设备文件', 'device file', '设备'],
          response: '📄 检测到设备信息文件，数据完整，无缺失内容，是否上传至设备知识库？（是/否）',
          nextState: 'pm_device_confirm'
        },
        {
          keywords: ['我上传了点位信息文件，请按设备编码字段从文件中结构化抽取设备数据，并检查字段完整性、格式正确性与重复项，明确标记缺失或异常的数据行', '点位文件', 'point file', '点位'],
          response: '📄 检测到点位信息文件，数据完整，无缺失内容，是否上传至点位知识库？（是/否）',
          nextState: 'pm_point_confirm'
        },
        {
          keywords: ['我上传了图例信息文件，请从文件中提取标准图例，对每一个图例，识别并标注其关联的设备名称，建立图例和设备之间的映射。若某图例无法对应到具体设备名，请明确列出待补项', '图例文件', 'legend file', '图例'],
          response: '📄 检测到图例信息文件，已建立图例和设备之间的映射，无待补项，是否上传至图例知识库？（是/否）',
          nextState: 'pm_legend_confirm'
        },
        {
          keywords: ['退出', '切换角色'],
          response: '已退出项目经理模式，请重新选择角色。',
          nextState: 'welcome'
        }
      ],
      defaultResponse: '👷 项目经理模式：请上传设备文件、点位文件或图例文件。'
    },

    pm_device_confirm: {
      name: '设备文件确认',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '✅ 设备信息文件已成功上传至设备知识库！知识库已更新。',
          nextState: 'project_manager'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消上传设备文件。',
          nextState: 'project_manager'
        }
      ],
      defaultResponse: '请确认是否上传设备信息文件至设备知识库？（是/否）'
    },

    pm_point_confirm: {
      name: '点位文件确认',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '✅ 点位信息文件已成功上传至点位知识库！知识库已更新。',
          nextState: 'project_manager'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消上传点位文件。',
          nextState: 'project_manager'
        }
      ],
      defaultResponse: '请确认是否上传点位信息文件至点位知识库？（是/否）'
    },

    pm_legend_confirm: {
      name: '图例文件确认',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '✅ 图例信息文件已成功上传至图例知识库！知识库已更新。',
          nextState: 'project_manager'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消上传图例文件。',
          nextState: 'project_manager'
        }
      ],
      defaultResponse: '请确认是否上传图例信息文件至图例知识库？（是/否）'
    },

    developer: {
      name: '开发人员',
      rules: [
        {
          keywords: ['我上传了一张图纸，请调用此前已建好的知识库，匹配图纸中的图例符号，判定每台设备的类型，并提取设备在图纸上的位置与相对布局，依次进行设备识别、点位绑定和界面生成，每个流程执行前向我确认', '图纸', 'upload drawing', 'drawing'],
          response: '📄 检测到图纸，是否进行设备识别？（是/否）',
          nextState: 'dev_drawing_recognize'
        },
        {
          keywords: ['发布组态', '发布'],
          response: '🚀 组态发布成功！画面已部署到生产环境。',
          nextState: 'developer'
        },
        {
          keywords: ['退出', '切换角色'],
          response: '已退出开发人员模式，请重新选择角色。',
          nextState: 'welcome'
        }
      ],
      defaultResponse: '👨‍💻 开发人员模式：请上传图纸进行设备识别。'
    },

    dev_drawing_recognize: {
      name: '设备识别',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '🔍 正在进行设备识别...\n\n识别完毕！已识别到以下设备：\n- 电动防烟防火阀 × 2\n- 电动风阀 × 17\n- 风机盘管 × 1\n- 回排风机 × 2\n- 空气幕 × 4\n- 连锁风阀 × 4\n- 排烟风机 × 2\n- 小新风机 × 2\n- 组合式空调箱 × 2\n\n是否进行点位绑定？（是/否）',
          nextState: 'dev_point_binding'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消设备识别。',
          nextState: 'developer'
        }
      ],
      defaultResponse: '请确认是否对图纸进行设备识别？（是/否）'
    },

    dev_point_binding: {
      name: '点位绑定',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '🔗 正在进行点位绑定...\n\n已从知识库加载设备和点位信息：\n- 设备知识库：已选中（9种设备）\n- 点位知识库：已选中（742个点位）\n\n点位绑定结束，是否生成界面？（是/否）',
          nextState: 'dev_generate_ui'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消点位绑定。',
          nextState: 'developer'
        }
      ],
      defaultResponse: '请确认是否进行点位绑定？（是/否）'
    },

    dev_generate_ui: {
      name: '界面生成',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '🎨 正在生成组态界面，请稍后...\n\n⏳ 界面即将生成\n- 预计生成组件：36个\n- 预计绑定点位：742个\n- 布局方式：自动排列\n\n请进入「编辑模式」进行核对与微调，确认无误后再发布。',
          nextState: 'developer'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消界面生成。',
          nextState: 'developer'
        }
      ],
      defaultResponse: '请确认是否生成组态界面？（是/否）'
    },

    user: {
      name: '使用人员',
      rules: [
        {
          keywords: ['打开画面', '打开发布画面', '画面'],
          response: '🖥️ 正在打开已发布的组态画面...\n\n画面已加载完成，您可以与组态画面交互，或使用AI助手查询运维信息。',
          nextState: 'user'
        },
        {
          keywords: ['查询运维信息', '运维', 'operation', 'maintenance'],
          response: '📊 运维信息查询结果：\n\n当前设备状态：\n- 🟢 正常运行：35台\n- 🟡 警告状态：1台\n- 🔴 故障告警：1台\n\n今日运维任务：\n1. 设备巡检（已完成）\n2. 系统备份（进行中）\n3. 日志清理（待执行）',
          nextState: 'user'
        },
        {
          keywords: ['交互', '操作', 'control'],
          response: '🎮 组态画面交互功能已就绪：\n- 点击设备查看详情\n- 拖动调整布局\n- 双击进入编辑模式\n- 右键菜单快捷操作',
          nextState: 'user'
        },
        {
          keywords: ['退出', '切换角色'],
          response: '已退出使用人员模式，请重新选择角色。',
          nextState: 'welcome'
        }
      ],
      defaultResponse: '👁️ 使用人员模式：请打开发布画面或查询运维信息。'
    }
  }
};

export class DemoScriptEngine {
  private currentState: string;

  constructor() {
    this.currentState = demoScript.initialState;
  }

  getCurrentStateName(): string {
    return demoScript.states[this.currentState]?.name || '未知';
  }

  processInput(input: string): { response: string; stateChanged: boolean } {
    const state = demoScript.states[this.currentState];
    if (!state) {
      return { response: '未知状态', stateChanged: false };
    }

    const lowerInput = input.toLowerCase();

    for (const rule of state.rules) {
      const matched = rule.keywords.some(keyword => 
        lowerInput.includes(keyword.toLowerCase())
      );
      if (matched) {
        const previousState = this.currentState;
        if (rule.nextState) {
          this.currentState = rule.nextState;
        }
        return { 
          response: rule.response, 
          stateChanged: previousState !== this.currentState 
        };
      }
    }

    return { response: state.defaultResponse, stateChanged: false };
  }

  reset(): void {
    this.currentState = demoScript.initialState;
  }

  getResponse(input: string): string {
    const result = this.processInput(input);
    return result.response;
  }

  getWelcomeMessage(role: string): string {
    if (role === 'project_manager') {
      this.currentState = 'project_manager';
      return '您好！欢迎使用AI智能助手。作为项目经理，您可以上传设备文件、点位文件和图例文件来构建知识库。';
    } else if (role === 'developer') {
      this.currentState = 'developer';
      return '您好！欢迎使用AI智能助手。作为开发人员，您可以上传图纸进行设备识别、点位绑定和界面生成。';
    } else if (role === 'user') {
      this.currentState = 'user';
      return '您好！欢迎使用AI智能助手。作为使用人员，您可以查询运维信息，与组态画面交互。';
    }
    return '';
  }
}