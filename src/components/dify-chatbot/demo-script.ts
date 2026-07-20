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
          keywords: ['上传设备文件', '设备文件', 'device file', '设备'],
          response: '📄 检测到设备信息文件，是否上传至设备知识库？(Y/N)',
          nextState: 'pm_device_confirm'
        },
        {
          keywords: ['上传点位文件', '点位文件', 'point file', '点位'],
          response: '📄 检测到点位信息文件，是否上传至点位知识库？(Y/N)',
          nextState: 'pm_point_confirm'
        },
        {
          keywords: ['上传图例文件', '图例文件', 'legend file', '图例'],
          response: '📄 检测到图例信息文件，是否上传至图例知识库？(Y/N)',
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
      defaultResponse: '请确认是否上传设备信息文件至设备知识库？(Y/N)'
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
      defaultResponse: '请确认是否上传点位信息文件至点位知识库？(Y/N)'
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
      defaultResponse: '请确认是否上传图例信息文件至图例知识库？(Y/N)'
    },

    developer: {
      name: '开发人员',
      rules: [
        {
          keywords: ['上传图纸', '图纸', 'upload drawing', 'drawing'],
          response: '📄 检测到图纸，是否进行设备识别？(Y/N)',
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
          response: '🔍 正在进行设备识别...\n\n识别完毕！已识别到以下设备：\n- 传感器 × 15\n- 控制器 × 8\n- 执行器 × 12\n\n是否进行点位绑定？(Y/N)',
          nextState: 'dev_point_binding'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消设备识别。',
          nextState: 'developer'
        }
      ],
      defaultResponse: '请确认是否对图纸进行设备识别？(Y/N)'
    },

    dev_point_binding: {
      name: '点位绑定',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '🔗 正在进行点位绑定...\n\n已从知识库加载设备和点位信息：\n- 设备知识库：已选中（35个设备）\n- 点位知识库：已选中（128个点位）\n\n点位绑定结束，是否生成界面？(Y/N)',
          nextState: 'dev_generate_ui'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消点位绑定。',
          nextState: 'developer'
        }
      ],
      defaultResponse: '请确认是否进行点位绑定？(Y/N)'
    },

    dev_generate_ui: {
      name: '界面生成',
      rules: [
        {
          keywords: ['Y', '是', 'yes', '确认'],
          response: '🎨 正在生成组态界面...\n\n✅ 界面生成成功！\n- 生成组件：52个\n- 绑定点位：128个\n- 布局方式：自动排列\n\n界面已就绪，可进行发布。',
          nextState: 'developer'
        },
        {
          keywords: ['N', '否', 'no', '取消'],
          response: '❌ 已取消界面生成。',
          nextState: 'developer'
        }
      ],
      defaultResponse: '请确认是否生成组态界面？(Y/N)'
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
          response: '📊 运维信息查询结果：\n\n当前设备状态：\n- 🟢 正常运行：28台\n- 🟡 警告状态：3台\n- 🔴 故障告警：1台\n\n今日运维任务：\n1. 设备巡检（已完成）\n2. 系统备份（进行中）\n3. 日志清理（待执行）',
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
}