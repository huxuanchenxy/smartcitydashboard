import json
import random
import string

def generate_random_id(prefix="", length=8):
    """生成随机 ID"""
    suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=length))
    return f"{prefix}{suffix}"

def merge_template(screen_name, components):
    """
    合并模板，生成正确的 JSON 格式
    :param screen_name: 屏幕名称
    :param components: 组件配置列表
    :return: 包含正确 JSON 的字典
    """
    # 读取正确的模板文件
    with open('f:/project/smartcity/dashboard2/dashboard/src/components/dify-chatbot/payloadpie.json', 'r', encoding='utf-8') as f:
        template = json.load(f)
    
    # 保存模板中的组件结构（如果有）
    component_template = template['coms'][0] if template['coms'] else None
    
    # 更新屏幕名称
    template['screen']['name'] = screen_name
    
    # 清空原有的组件列表
    template['coms'] = []
    
    # 处理每个组件
    for component in components:
        # 创建新的组件配置，基于模板中的组件结构
        if component_template:
            new_component = component_template.copy()
        else:
            # 如果模板中没有组件，创建一个基本结构
            new_component = {
                "id": generate_random_id(f"{component.get('name', 'Component')}_"),
                "name": component.get('name', 'Component'),
                "type": "com",
                "alias": component.get('alias', ''),
                "icon": "v-icon-chart-pie",
                "img": "images/缩略图/基本饼图.png",
                "locked": False,
                "hided": False,
                "eventhub": False,
                "selected": False,
                "hovered": False,
                "renameing": False,
                "special": "",
                "attr": component.get('attr', {
                    "x": 0,
                    "y": 0,
                    "w": 500,
                    "h": 300,
                    "deg": 0,
                    "opacity": 1,
                    "filpV": False,
                    "filpH": False
                }),
                "projectId": 186,
                "handles": {
                    "click": {
                        "eventName": "click",
                        "description": "点击",
                        "fields": []
                    },
                    "mouseEnter": {
                        "eventName": "mouseEnter",
                        "description": "鼠标移入",
                        "fields": []
                    },
                    "mouseLeave": {
                        "eventName": "mouseLeave",
                        "description": "鼠标移出",
                        "fields": []
                    }
                },
                "ichandles": {},
                "config": {
                    "graphical": {
                        "margin": {
                            "top": 0,
                            "bottom": 0,
                            "left": 0,
                            "right": 0
                        },
                        "pieRadius": 50,
                        "pieColor": "#c23531",
                        "pieLine": {
                            "type": "solid",
                            "width": 0,
                            "color": "#c23531"
                        },
                        "Nightingale": True,
                        "colour": True,
                        "colorList": [
                            {"value": "#589799"},
                            {"value": "#76C3D1"},
                            {"value": "#537FA9"},
                            {"value": "#8CF1EB"},
                            {"value": "#82C5F9"},
                            {"value": "#FFD977"},
                            {"value": "#8277F6"},
                            {"value": "#E6E6E6"},
                            {"value": "#FFFFFF"}
                        ]
                    },
                    "legend": {
                        "show": False,
                        "top": "top",
                        "left": "left",
                        "textStyle": {
                            "fontFamily": "Microsoft YaHei",
                            "fontWeight": "normal",
                            "fontSize": 12,
                            "color": "#fff"
                        },
                        "orient": "vertical",
                        "align": "left",
                        "showValue": False
                    },
                    "tooltip": {
                        "triggerOn": "mousemove",
                        "textStyle": {
                            "fontFamily": "Microsoft YaHei",
                            "fontWeight": "normal",
                            "fontSize": 12,
                            "color": "#333"
                        },
                        "padding": 5
                    },
                    "content": {
                        "enabled": True,
                        "padding": 5,
                        "textStyle": {
                            "fontFamily": "Microsoft YaHei",
                            "fontWeight": "normal",
                            "fontSize": 12,
                            "color": "rgba(255, 255, 255, 0.3)"
                        }
                    },
                    "frameBackground": {
                        "horizontal": 12,
                        "vertical": 12,
                        "backgroundColor": "#333",
                        "borderStyle": {
                            "type": "dashed",
                            "width": 1,
                            "color": "#f5dc69",
                            "radius": 4
                        }
                    },
                    "animation": {
                        "enabled": False,
                        "easing": "cubicOut",
                        "duration": 1000
                    },
                    "series": [
                        {
                            "type": "pie",
                            "id": "系列1_34uwWkWF0q",
                            "name": "系列1",
                            "column": None,
                            "color": {
                                "type": "solid",
                                "value": "#00baff",
                                "from": "#fff",
                                "to": "#000"
                            }
                        }
                    ]
                },
                "apis": {
                    "source": {
                        "fields": {
                            "type": {
                                "type": "string",
                                "map": "",
                                "description": "分类",
                                "optional": False
                            },
                            "value": {
                                "type": "string",
                                "map": "",
                                "description": "值",
                                "optional": False
                            }
                        },
                        "render": "render",
                        "description": "基本饼图接口",
                        "useAutoUpdate": False,
                        "autoUpdate": 1
                    }
                },
                "apiData": {
                    "source": {
                        "comId": "",
                        "id": "",
                        "type": "static",
                        "pageFilters": [],
                        "config": {
                            "useFilter": False,
                            "data": "",
                            "postBodyType": "static"
                        }
                    }
                },
                "events": {
                    "click": {
                        "description": "当点击数据项时",
                        "fields": {
                            "type": {
                                "type": "string",
                                "map": "",
                                "description": "分类",
                                "optional": False
                            },
                            "value": {
                                "type": "string",
                                "map": "",
                                "description": "值",
                                "optional": False
                            }
                        }
                    }
                },
                "actions": {}
            }
        
        # 更新组件 ID
        new_component['id'] = generate_random_id(f"{component.get('name', 'Component')}_")
        
        # 更新组件名称和别名
        if 'name' in component:
            new_component['name'] = component['name']
        if 'alias' in component:
            new_component['alias'] = component['alias']
        
        # 更新组件属性
        if 'attr' in component:
            new_component['attr'].update(component['attr'])
        
        # 生成新的 API 数据 ID
        new_component['apiData']['source']['comId'] = new_component['id']
        new_component['apiData']['source']['id'] = generate_random_id("t_")
        
        # 保持正确的 API 字段结构（使用 type 和 value）
        new_component['apis']['source']['fields'] = {
            "type": {
                "type": "string",
                "map": "",
                "description": "分类",
                "optional": False
            },
            "value": {
                "type": "string",
                "map": "",
                "description": "值",
                "optional": False
            }
        }
        
        # 保持正确的事件字段结构
        new_component['events']['click']['fields'] = {
            "type": {
                "type": "string",
                "map": "",
                "description": "分类",
                "optional": False
            },
            "value": {
                "type": "string",
                "map": "",
                "description": "值",
                "optional": False
            }
        }
        
        # 保持正确的数据格式（使用 type 和 value）
        new_component['apiData']['source']['config']['data'] = json.dumps([
            {"type": "类别A", "value": 30},
            {"type": "类别B", "value": 25},
            {"type": "类别C", "value": 45}
        ])
        
        # 添加到组件列表
        template['coms'].append(new_component)
    
    # 生成最终的 JSON
    result_json = json.dumps(template, ensure_ascii=False, indent=2)
    
    return {
        "json": result_json
    }

def main(screen_name, components_json):
    """
    主函数，处理输入并返回结果
    :param screen_name: 屏幕名称
    :param components_json: 组件配置的 JSON 字符串
    :return: 包含正确 JSON 的字典
    """
    try:
        components = json.loads(components_json)
        return merge_template(screen_name, components)
    except Exception as e:
        return {
            "json": json.dumps({"error": str(e)}, ensure_ascii=False)
        }

# 测试代码
if __name__ == "__main__":
    test_components = [
        {
            "name": "VBasicPie",
            "alias": "基本饼图",
            "attr": {
                "x": 346,
                "y": 341,
                "w": 500,
                "h": 300,
                "deg": 0,
                "opacity": 1,
                "filpV": False,
                "filpH": False
            }
        }
    ]
    
    result = main("测试demo1", json.dumps(test_components))
    print(result['json'])
    
    # 保存结果到文件
    with open('f:/project/smartcity/dashboard2/dashboard/src/components/dify-chatbot/test_output.json', 'w', encoding='utf-8') as f:
        json.dump(json.loads(result['json']), f, ensure_ascii=False, indent=2)
    
    print("测试完成，结果已保存到 test_output.json")
