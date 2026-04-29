import json
import random
import string
import copy

def generate_id(prefix: str = "") -> str:
    """生成随机ID后缀"""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    if prefix:
        # 修正：将可能包含空格的组件名处理一下
        clean_prefix = prefix.replace(' ', '')
        return f"{clean_prefix}_{suffix}"
    return suffix


def main(screen_name: str, components: str,component_templates: dict) -> dict:
    # 解析输入
    if isinstance(components, str):
        comp_list = json.loads(components)
    else:
        comp_list = components

    
    if isinstance(component_templates, str):
        COMPONENT_TEMPLATES = json.loads(component_templates)
    else:
        COMPONENT_TEMPLATES = component_templates
    # 生成 screen ID
    screen_id = random.randint(100, 999)

    result_coms = []

    for comp in comp_list:
        name = comp['name']
        template = COMPONENT_TEMPLATES.get(name, {})

        if not template:
            # 如果模板不存在，跳过该组件或使用默认处理
            continue

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

        # 修正 config.series 的ID（仅对饼图、柱状图等有series的组件）
        if 'series' in config and isinstance(config['series'], list):
            for i, series in enumerate(config['series']):
                if 'id' in series:
                    series['id'] = f"系列{i+1}_{generate_id()[:6]}"
                elif series.get('type') == 'pie':
                    # 为饼图的series添加id
                    series['id'] = f"系列{i+1}_{generate_id()[:6]}"

        # 构建 apiData - 优先级: comp传入 > 模板中的apiData > 模板中的default_data
        api_data = comp.get('apiData', {})
        
        # 获取模板中的备选数据
        template_api_data = template.get('apiData', {})
        template_default_data = template.get('default_data', '[]')
        
        # 提取模板中的数据字符串
        template_data_str = template_default_data
        if template_api_data and 'source' in template_api_data and 'config' in template_api_data['source']:
            template_data = template_api_data['source']['config'].get('data', '')
            if template_data and template_data != '[]' and template_data != '{}':
                template_data_str = template_data
        
        # 默认使用模板数据
        data_str = template_data_str
        
        # 如果LLM提供了数据，使用LLM的数据
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

        # 构建 events
        apis_fields = {}
        if apis and 'source' in apis:
            apis_fields = apis['source'].get('fields', {})

        # 根据组件类型决定是否生成 events
        non_chart_components = ['VMainTitle', 'VButton', 'VProgress', 'VVideo', 'VThreedViewer', 'VBgBox', 'VBorderBox', 'VDecoration', 'VBasicCarousel']
        
        if name in non_chart_components:
            events = {}
        else:
            # 对于图表组件，使用模板中fields定义的字段名
            events = {
                "click": {
                    "description": "当点击数据项时",
                    "fields": copy.deepcopy(apis_fields)
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
            "projectId": screen_id,
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