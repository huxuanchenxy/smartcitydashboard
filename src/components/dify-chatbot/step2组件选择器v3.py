import json

def main(**kwargs) -> dict:
    # 1. 获取输入数据
    input_data = kwargs.get('json_input') or kwargs.get('components') or kwargs.get('input') or list(kwargs.values())[0] if kwargs else None

    if not input_data:
        return {'components': '[]'}

    comp_list = []
    
    # 2. 解析逻辑
    try:
        if isinstance(input_data, str):
            parsed_data = json.loads(input_data)
            if isinstance(parsed_data, dict):
                inner_comp = parsed_data.get('components')
                if isinstance(inner_comp, str):
                    comp_list = json.loads(inner_comp)
                elif isinstance(inner_comp, list):
                    comp_list = inner_comp
            elif isinstance(parsed_data, list):
                comp_list = parsed_data
        elif isinstance(input_data, list):
            comp_list = input_data
        elif isinstance(input_data, dict):
             inner_comp = input_data.get('components')
             if isinstance(inner_comp, list): comp_list = inner_comp
             elif isinstance(inner_comp, str): comp_list = json.loads(inner_comp)
    except Exception as e:
        print(f"解析错误: {e}")
        return {'components': '[]'}

    # --- 组件配置字典 ---
    component_dict = {
        'bar': {
            'default': {'name': 'VBasicBar', 'alias': '柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/柱状图.png'},
            'multi': {'name': 'VMultiBar', 'alias': '垂直分组柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/垂直分组柱状图.png'},
            'dynamic': {'name': 'VDynamicBar', 'alias': '动态分组柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/垂直分组柱状图.png'},
            'drill': {'name': 'VDrillDownBar', 'alias': '钻取柱图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/柱状图.png'},
            'polar': {'name': 'VPolarBar', 'alias': '极坐标柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/极坐标柱状图.png'},
            'waterfall': {'name': 'VWaterfall', 'alias': '瀑布图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/瀑布图.png'},
        },
        'horizontal': {
            'default': {'name': 'VBasicHorizontal', 'alias': '基本条形图', 'icon': 'v-icon-chart-bar', 'img': 'images/缩略图/基本条形图.png'},
        },
        'arcbar': {
            'default': {'name': 'VArcBar', 'alias': '玉环图', 'icon': 'v-icon-chart-bar', 'img': 'images/缩略图/玉环图.png'},
        },
        'pie': {
            'default': {'name': 'VBasicPie', 'alias': '基本饼图', 'icon': 'v-icon-chart-pie', 'img': 'images/大图/基本饼图.png'},
            'dashboard': {'name': 'VDashboardPie', 'alias': '仪表饼图', 'icon': 'v-icon-chart-pie', 'img': 'images/大图/仪表饼图.png'},
        },
        'line': {
            'default': {'name': 'VBasicLine', 'alias': '基本折线图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/基本折线图.png'},
            'dynamic': {'name': 'VDynamicLine', 'alias': '动态折线图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/基本折线图.png'},
        },
        'area': {
            'default': {'name': 'VBasicArea', 'alias': '区域图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/区域图.png'},
            'stack': {'name': 'VStackArea', 'alias': '堆叠区域图', 'icon': 'v-icon-chart-line', 'img': 'images/大图/堆叠区域图.png'},
        },
        'radar': {'default': {'name': 'VBasicRadar', 'alias': '雷达图', 'icon': 'v-icon-chart-radar', 'img': 'images/大图/雷达图.png'}},
        'scatter': {'default': {'name': 'VPunchCardScatter', 'alias': '打卡气泡图', 'icon': 'v-icon-chart-scatter', 'img': 'images/大图/打卡气泡图.png'}},
        'heatmap': {'default': {'name': 'VCartesianHeatmap', 'alias': '笛卡尔热力图', 'icon': 'v-icon-chart-heatmap', 'img': 'images/大图/笛卡尔热力图.png'}},
        'funnel': {'default': {'name': 'VFunnel', 'alias': '漏斗图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/漏斗图.png'}},
        'wordcloud': {'default': {'name': 'VWordCloud', 'alias': '词云', 'icon': 'v-icon-other', 'img': 'images/大图/词云.png'}},
        'waterlevel': {'default': {'name': 'VWaterLevel', 'alias': '水位图', 'icon': 'v-icon-other', 'img': 'images/大图/水位图.png'}},
        'map': {'default': {'name': 'VGdMap', 'alias': '高德地图', 'icon': 'v-icon-map', 'img': 'images/大图/高德地图.png'}},
        'title': {'default': {'name': 'VMainTitle', 'alias': '通用标题', 'icon': 'v-icon-title', 'img': 'images/大图/通用标题.png'}},
        'table': {'default': {'name': 'VBasicCarousel', 'alias': '滚动表格', 'icon': 'v-icon-other', 'img': 'images/大图/滚动表格.png'}},
        'button': {'default': {'name': 'VButton', 'alias': '按钮', 'icon': 'v-icon-interact', 'img': 'images/大图/按钮.png'}},
        'progress': {'default': {'name': 'VProgress', 'alias': '进度条', 'icon': 'v-icon-interact', 'img': 'images/大图/进度条.png'}},
        'video': {'default': {'name': 'VVideo', 'alias': '视频播放', 'icon': 'v-icon-media', 'img': 'images/大图/视频播放.png'}},
        'threed': {'default': {'name': 'VThreedViewer', 'alias': '3D视图', 'icon': 'v-icon-media', 'img': 'images/大图/threedViewer.png'}},
        'bgbox': {'default': {'name': 'VBgBox', 'alias': '自定义背景块', 'icon': 'v-icon-media', 'img': 'images/大图/自定义背景块.png'}},
        'border': {'default': {'name': 'VBorderBox', 'alias': '边框', 'icon': 'v-icon-media', 'img': 'images/大图/边框.png'}},
        'decoration': {'default': {'name': 'VDecoration', 'alias': '装饰', 'icon': 'v-icon-media', 'img': 'images/大图/装饰.png'}},
        'timer': {'default': {'name': 'VTimer', 'alias': '时间器', 'icon': 'v-icon-title','img': 'images/缩略图/时间器.png'}},
        'image': {'default': {'name': 'VMainImg', 'alias': '单张图片', 'icon': 'v-icon-media','img': 'images/缩略图/单张图片.png'}},
    }
    
    result = []
    for comp in comp_list:
        if not isinstance(comp, dict):
            continue
            
        chart_type = comp.get('chartType', '')
        detail = comp.get('detail', '')  # <--- 这里定义的是 detail
        position = comp.get('position', 'auto')
        
        variants = component_dict.get(chart_type, {})
        selected = variants.get('default', {'name': 'VBasicBar', 'alias': '柱状图', 'icon': 'v-icon-chart-bar', 'img': 'images/大图/柱状图.png'}).copy()
        
        # --- 🛠️ 修改核心：处理 "dynamic,multi" 这种多标签情况 ---
        # 修正点：将 detail_str 改为 detail，保持变量名一致
        if detail: 
            # 1. 将字符串拆分为列表，并去除空格
            detail_tags = [tag.strip() for tag in detail.split(',') if tag.strip()]
            
            # 2. 定义优先级
            # 如果你想优先输出 VDynamicBar，就把 'dynamic' 放在 'multi' 前面
            priority_order = ['dynamic', 'multi', 'drill', 'polar', 'waterfall', 'stack']
            
            matched = False
            # 按照优先级顺序查找
            for tag in priority_order:
                if tag in detail_tags and tag in variants:
                    selected = variants[tag].copy()
                    matched = True
                    break
            
            # 如果优先级列表里没有，再尝试直接匹配（兜底）
            if not matched:
                for tag in detail_tags:
                    if tag in variants:
                        selected = variants[tag].copy()
                        break

        selected['position'] = position
        result.append(selected)
    
    return {
        'components': json.dumps(result, ensure_ascii=False)
    }