import json
import random
import string
import copy

# 组件模板库（已修正 VMainTitle 等组件）
COMPONENT_TEMPLATES = {
    "VBasicPie": {
        "alias": "基本饼图",
        "icon": "v-icon-chart-pie",
        "img": "images/缩略图/基本饼图.png",
        "config": {
            "graphical": {
                "margin": {"top": 0, "bottom": 0, "left": 0, "right": 0},
                "pieRadius": 50,
                "pieColor": "#c23531",
                "pieLine": {"type": "solid", "width": 0, "color": "#c23531"},
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
                "textStyle": {"fontFamily": "Microsoft YaHei", "fontWeight": "normal", "fontSize": 12, "color": "#fff"},
                "orient": "vertical",
                "align": "left",
                "showValue": False
            },
            "tooltip": {
                "triggerOn": "mousemove",
                "textStyle": {"fontFamily": "Microsoft YaHei", "fontWeight": "normal", "fontSize": 12, "color": "#333"},
                "padding": 5
            },
            "content": {
                "enabled": True,
                "padding": 5,
                "textStyle": {"fontFamily": "Microsoft YaHei", "fontWeight": "normal", "fontSize": 12, "color": "rgba(255, 255, 255, 0.3)"}
            },
            "frameBackground": {
                "horizontal": 12,
                "vertical": 12,
                "backgroundColor": "#333",
                "borderStyle": {"type": "dashed", "width": 1, "color": "#f5dc69", "radius": 4}
            },
            "animation": {"enabled": False, "easing": "cubicOut", "duration": 1000},
            "series": [{"type": "pie", "name": "系列1", "color": {"type": "solid", "value": "#00baff", "from": "#fff", "to": "#000"}}]
        },
        "handles": {
            "click": {"eventName": "click", "description": "点击", "fields": []},
            "mouseEnter": {"eventName": "mouseEnter", "description": "鼠标移入", "fields": []},
            "mouseLeave": {"eventName": "mouseLeave", "description": "鼠标移出", "fields": []}
        },
        "ichandles": {},
        "apis": {
            "source": {
                "fields": {
                    "type": {"type": "string", "map": "", "description": "分类", "optional": False},
                    "value": {"type": "string", "map": "", "description": "值", "optional": False}
                },
                "render": "render",
                "description": "基本饼图接口",
                "useAutoUpdate": False,
                "autoUpdate": 1
            }
        },
        "default_data": "[{\"type\":\"周一\",\"value\":150},{\"type\":\"周二\",\"value\":230},{\"type\":\"周三\",\"value\":224},{\"type\":\"周四\",\"value\":218},{\"type\":\"周五\",\"value\":135},{\"type\":\"周六\",\"value\":147},{\"type\":\"周日\",\"value\":260}]"
    }
}

def generate_id(prefix: str = "") -> str:
    """生成随机ID后缀"""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    if prefix:
        return f"{prefix}_{suffix}"
    return suffix

def main(screen_name: str, components: str) -> dict:
    # 解析输入
    if isinstance(components, str):
        comp_list = json.loads(components)
    else:
        comp_list = components
    
    # 生成 screen ID
    screen_id = random.randint(100, 999)
    
    result_coms = []
    
    for comp in comp_list:
        name = comp['name']
        template = COMPONENT_TEMPLATES.get(name, {})
        
        # 生成组件唯一ID
        comp_id = generate_id(name)
        
        # 获取LLM生成的值（如果存在），否则用模板默认值
        alias = comp.get('alias', template.get('alias', name))
        icon = comp.get('icon', template.get('icon', ''))
        img = comp.get('img', template.get('img', ''))
        attr = comp.get('attr', {})
        
        # 深度复制模板配置，避免修改原始模板
        config = copy.deepcopy(template.get('config', {}))
        handles = copy.deepcopy(template.get('handles', {}))
        ichandles = copy.deepcopy(template.get('ichandles', {}))
        apis = copy.deepcopy(template.get('apis', {}))
        
        # 修正 config.series 的ID
        if 'series' in config:
            for i, series in enumerate(config['series']):
                series['id'] = f"系列{i+1}_{generate_id()[:6]}"
        
        # 构建 apiData
        api_data = comp.get('apiData', {})
        data_str = template.get('default_data', '[]')
        
        # 如果LLM提供了数据，使用LLM的数据；否则用模板默认数据
        if api_data and 'source' in api_data and 'config' in api_data['source']:
            llm_data = api_data['source']['config'].get('data', '')
            if llm_data and llm_data != '[]' and llm_data != '{}':
                data_str = llm_data
        
        merged_api_data = {
            "source": {
                "comId": comp_id,
                "id": generate_id("t"),
                "type": "static",
                "pageFilters": [],
                "config": {
                    "useFilter": False,
                    "data": data_str,
                    "postBodyType": "static"
                }
            }
        }
        
        # 构建 events（标题组件为空，图表组件有click）
        apis_fields = {}
        if apis and 'source' in apis:
            apis_fields = apis['source'].get('fields', {})
        
        # 根据组件类型决定是否生成 events
        if name in ['VMainTitle', 'VButton', 'VProgress', 'VVideo', 'VThreedViewer', 'VBgBox', 'VBorderBox', 'VDecoration']:
            events = {}
        else:
            events = {
                "click": {
                    "description": "当点击数据项时",
                    "fields": apis_fields
                }
            }
        
        # 组装完整组件
        merged_comp = {
            "id": comp_id,
            "name": name,
            "type": "com",
            "alias": alias,
            "icon": icon,
            "img": img,
            "locked": False,
            "hided": False,
            "eventhub": False,
            "selected": False,
            "hovered": False,
            "renameing": False,
            "special": "",
            "attr": attr,
            "projectId": screen_id,  # 修正：与 screen.id 一致
            "handles": handles,
            "ichandles": ichandles,
            "config": config,
            "apis": apis,
            "apiData": merged_api_data,
            "events": events,
            "actions": {}
        }
        
        result_coms.append(merged_comp)
    
    # 组装最终JSON
    result = {
        "screen": {
            "id": screen_id,
            "name": screen_name,
            "share": "",
            "thumbnail": None,
            "groupId": 4
        },
        "config": {
            "width": 1920,
            "height": 1080,
            "bgimage": "data/originPic/bj.png",
            "bgcolor": "rgba(13,42,67,0)",
            "grid": 8,
            "screenshot": "",
            "zoomMode": 1,
            "useWatermark": False,
            "styleFilterParams": {
                "enable": False,
                "hue": 0,
                "saturate": 100,
                "brightness": 100,
                "contrast": 100,
                "opacity": 100
            },
            "tokenSettings": []
        },
        "coms": result_coms,
        "variables": {
            "componentsView": {},
            "publishersView": {},
            "subscribersView": {}
        },
        "dataFilters": []
    }
    
    return {
        'json': json.dumps(result, ensure_ascii=False)
    }

# 测试饼图组件
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

# 调用main函数
result = main("测试demo1", json.dumps(test_components))

# 解析结果
parsed_result = json.loads(result['json'])

# 打印饼图组件配置
pie_component = parsed_result['coms'][0]
print("饼图组件配置:")
print(json.dumps(pie_component, ensure_ascii=False, indent=2))

# 检查是否包含正确的配置结构
print("\n验证配置结构:")
if 'graphical' in pie_component['config']:
    print("✓ 包含graphical配置")
else:
    print("✗ 缺少graphical配置")

if 'type' in pie_component['apis']['source']['fields']:
    print("✓ 包含type字段")
else:
    print("✗ 缺少type字段")

if 'value' in pie_component['apis']['source']['fields']:
    print("✓ 包含value字段")
else:
    print("✗ 缺少value字段")

# 检查默认数据格式
print("\n默认数据格式:")
data = json.loads(pie_component['apiData']['source']['config']['data'])
print(json.dumps(data, ensure_ascii=False, indent=2))

# 检查数据字段是否正确
if len(data) > 0:
    first_item = data[0]
    if 'type' in first_item and 'value' in first_item:
        print("\n✓ 数据格式正确，包含type和value字段")
    else:
        print("\n✗ 数据格式不正确，缺少type或value字段")
